import { describe, expect, it } from "vitest";
import { GameSessionStatus } from "@/generated/prisma/enums";
import type { GameEvent, GameState } from "@/game/core";
import { GameServiceError } from "@/server/games/errors";
import type { GameRepository, LoggedEvent, MutationResult, StoredGame } from "@/server/games/repository";
import { GameService } from "@/server/games/service";
import { parseGameSnapshot } from "@/server/games/snapshot";

class MemoryRepository implements GameRepository {
  games = new Map<string, StoredGame>();
  logs = new Map<string, Array<{ actionId: string; result: MutationResult }>>();

  async create(ownerSessionId: string, state: GameState, replaces?: { id: string; expectedRevision: number }) {
    for (const game of this.games.values()) if (game.ownerSessionId === ownerSessionId && game.status === GameSessionStatus.ACTIVE) game.status = GameSessionStatus.ABANDONED;
    if (replaces && this.games.has(replaces.id)) this.games.get(replaces.id)!.status = GameSessionStatus.RESTARTED;
    const game: StoredGame = { id: state.id, ownerSessionId, revision: state.revision, state: structuredClone(state), status: GameSessionStatus.ACTIVE };
    this.games.set(game.id, game);
    return structuredClone(game);
  }

  async findCurrent(ownerSessionId: string) {
    const games = [...this.games.values()].filter((game) => game.ownerSessionId === ownerSessionId && (game.status === GameSessionStatus.ACTIVE || game.status === GameSessionStatus.FINISHED));
    return games.length ? structuredClone(games.at(-1)!) : null;
  }

  async findAuthorized(id: string, ownerSessionId: string) {
    const game = this.games.get(id);
    return game?.ownerSessionId === ownerSessionId ? structuredClone(game) : null;
  }

  async mutate(id: string, ownerSessionId: string, expectedRevision: number, actionId: string, change: (state: GameState) => MutationResult) {
    const game = this.games.get(id);
    if (!game || game.ownerSessionId !== ownerSessionId) throw new GameServiceError("NOT_FOUND", "não encontrada", 404);
    if (game.revision !== expectedRevision) throw new GameServiceError("REVISION_CONFLICT", "conflito", 409);
    const logs = this.logs.get(id) ?? [];
    if (logs.some((log) => log.actionId === actionId)) throw new GameServiceError("DUPLICATE_ACTION", "duplicada", 409);
    const result = change(structuredClone(game.state));
    game.state = structuredClone(result.state);
    game.revision = result.state.revision;
    game.status = result.state.phase === "FINISHED" ? GameSessionStatus.FINISHED : GameSessionStatus.ACTIVE;
    logs.push({ actionId, result: structuredClone(result) });
    this.logs.set(id, logs);
    return structuredClone(result);
  }

  async abandon(id: string, ownerSessionId: string, expectedRevision: number) {
    const game = this.games.get(id);
    if (!game || game.ownerSessionId !== ownerSessionId || game.revision !== expectedRevision) throw new GameServiceError("REVISION_CONFLICT", "conflito", 409);
    game.status = GameSessionStatus.ABANDONED;
  }

  async recentEvents(id: string): Promise<LoggedEvent[]> {
    return (this.logs.get(id) ?? []).flatMap((log) => log.result.events.map((event: GameEvent, index) => ({ id: `${log.result.state.revision}-${index}`, event: structuredClone(event) })));
  }
}

const config = { humanName: "Ana", botCount: 1 as const, seed: 42 };
const take = { type: "TAKE_SAME", color: "yellow" } as const;

describe("persistência autoritativa de partidas", () => {
  it("cria e recupera a mesma revisão pela sessão proprietária", async () => {
    const repository = new MemoryRepository();
    const service = new GameService(repository);
    const created = await service.create("owner-a", config);
    const recovered = await service.current("owner-a");
    expect(recovered?.game).toEqual(created.game);
    expect(await service.current("owner-b")).toBeNull();
  });

  it("salva ação válida, incrementa revision e registra eventos", async () => {
    const service = new GameService(new MemoryRepository());
    const created = await service.create("owner", config);
    const changed = await service.act(created.game.id, "owner", { actionId: "action-1", expectedRevision: 0, action: take });
    expect(changed.game.revision).toBe(1);
    expect(changed.events.some((entry) => entry.event.type === "TOKENS_TAKEN")).toBe(true);
  });

  it("não altera o snapshot quando a ação é inválida", async () => {
    const repository = new MemoryRepository();
    const service = new GameService(repository);
    const created = await service.create("owner", config);
    await expect(service.act(created.game.id, "owner", { actionId: "bad", expectedRevision: 0, action: { type: "TAKE_SAME", color: "green" } })).rejects.toMatchObject({ code: "INVALID_ACTION" });
    expect((await service.get(created.game.id, "owner")).game.revision).toBe(0);
  });

  it("rejeita revisão desatualizada e actionId duplicado", async () => {
    const service = new GameService(new MemoryRepository());
    const created = await service.create("owner", config);
    await service.act(created.game.id, "owner", { actionId: "one", expectedRevision: 0, action: take });
    await expect(service.act(created.game.id, "owner", { actionId: "two", expectedRevision: 0, action: take })).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    await expect(service.act(created.game.id, "owner", { actionId: "one", expectedRevision: 1, action: take })).rejects.toMatchObject({ code: "DUPLICATE_ACTION" });
  });

  it("impede acesso por outra sessão", async () => {
    const service = new GameService(new MemoryRepository());
    const created = await service.create("owner", config);
    await expect(service.get(created.game.id, "intruso")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("processa os turnos dos robôs no servidor até devolver ao humano", async () => {
    const service = new GameService(new MemoryRepository());
    const created = await service.create("owner", config);
    const afterHuman = await service.act(created.game.id, "owner", { actionId: "human", expectedRevision: 0, action: take });
    expect(afterHuman.game.activePlayerId).toBe("bot-1");
    const afterBot = await service.advance(created.game.id, "owner", { expectedRevision: 1 });
    expect(afterBot.game.activePlayerId).toBe("human");
    expect(afterBot.game.revision).toBeGreaterThan(1);
  });

  it("reinicia somente por comando explícito e isola logs antigos", async () => {
    const repository = new MemoryRepository();
    const service = new GameService(repository);
    const first = await service.create("owner", config);
    await service.act(first.game.id, "owner", { actionId: "old", expectedRevision: 0, action: take });
    await expect(service.restart(first.game.id, "owner", { expectedRevision: 0, config })).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
    const restarted = await service.restart(first.game.id, "owner", { expectedRevision: 1, config });
    expect(restarted.game.id).not.toBe(first.game.id);
    expect(restarted.game.revision).toBe(0);
    expect(restarted.events).toEqual([]);
    expect(repository.games.get(first.game.id)?.status).toBe(GameSessionStatus.RESTARTED);
  });

  it("abandona a partida sem apagar seu histórico", async () => {
    const repository = new MemoryRepository();
    const service = new GameService(repository);
    const created = await service.create("owner", config);
    await service.abandon(created.game.id, "owner", { expectedRevision: 0 });
    expect(await service.current("owner")).toBeNull();
    expect(repository.games.has(created.game.id)).toBe(true);
  });

  it("rejeita snapshot malformado e snapshot que viola invariantes", () => {
    expect(() => parseGameSnapshot(null)).toThrowError(/estrutura/);
    const invalid = { id: "x", revision: 0, players: [], catalog: Array(90).fill({}), decks: {}, visibleCards: {}, bank: {}, turnOrder: [] };
    expect(() => parseGameSnapshot(invalid)).toThrowError(/recursos/);
  });
});
