import "server-only";
import { randomUUID } from "node:crypto";
import { chooseBasicBotAction } from "@/game/bots";
import { applyGameAction, getPlayerView, seededRandom, type GameAction, type GameState } from "@/game/core";
import { createLocalGame, type LocalActionInput, type LocalGameConfig } from "@/features/game/local/local-game";
import type { GameEnvelope } from "./contracts";
import { GameServiceError } from "./errors";
import { PrismaGameRepository, type GameRepository, type MutationResult, type StoredGame } from "./repository";

const MAX_BOT_ACTIONS = 32;

function validateConfig(value: unknown): LocalGameConfig {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new GameServiceError("BAD_REQUEST", "Configuração de partida inválida.", 400);
  const input = value as Record<string, unknown>;
  if (typeof input.humanName !== "string" || input.humanName.trim().length < 1 || input.humanName.trim().length > 24) {
    throw new GameServiceError("BAD_REQUEST", "Informe um nome entre 1 e 24 caracteres.", 400);
  }
  if (input.botCount !== 1 && input.botCount !== 2 && input.botCount !== 3) throw new GameServiceError("BAD_REQUEST", "Escolha de 1 a 3 robôs.", 400);
  if (input.seed !== undefined && (!Number.isInteger(input.seed) || Number(input.seed) < 0)) throw new GameServiceError("BAD_REQUEST", "A seed deve ser um inteiro não negativo.", 400);
  return { humanName: input.humanName.trim(), botCount: input.botCount, seed: input.seed as number | undefined };
}

function validateCommand(value: unknown): { actionId: string; expectedRevision: number; action: LocalActionInput } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new GameServiceError("BAD_REQUEST", "Comando inválido.", 400);
  const input = value as Record<string, unknown>;
  if (typeof input.actionId !== "string" || input.actionId.trim().length < 1 || input.actionId.length > 191) throw new GameServiceError("BAD_REQUEST", "actionId inválido.", 400);
  if (!Number.isInteger(input.expectedRevision) || Number(input.expectedRevision) < 0) throw new GameServiceError("BAD_REQUEST", "expectedRevision inválida.", 400);
  if (typeof input.action !== "object" || input.action === null || Array.isArray(input.action)) throw new GameServiceError("BAD_REQUEST", "A intenção da ação é obrigatória.", 400);
  return { actionId: input.actionId, expectedRevision: Number(input.expectedRevision), action: input.action as LocalActionInput };
}

function transition(state: GameState, action: unknown): MutationResult {
  const result = applyGameAction(state, action);
  if (!result.ok) throw new GameServiceError("INVALID_ACTION", result.error.message, 422);
  const accepted = result.state.actionHistory.at(-1);
  if (!accepted) throw new GameServiceError("INVALID_SNAPSHOT", "A ação não foi registrada pelo motor.", 500);
  return { state: result.state, events: result.events, action: action as GameAction };
}

export class GameService {
  constructor(private repository?: GameRepository) {}

  private get store(): GameRepository {
    this.repository ??= new PrismaGameRepository();
    return this.repository;
  }

  private async envelope(game: StoredGame): Promise<GameEnvelope> {
    return {
      game: getPlayerView(game.state, "human"),
      events: await this.store.recentEvents(game.id),
    };
  }

  async create(ownerSessionId: string, input: unknown, replaces?: { id: string; expectedRevision: number }): Promise<GameEnvelope> {
    const config = validateConfig(input);
    const id = randomUUID();
    const state = createLocalGame({ ...config, seed: config.seed ?? Date.now() }, id);
    return this.envelope(await this.store.create(ownerSessionId, state, replaces));
  }

  async current(ownerSessionId: string): Promise<GameEnvelope | null> {
    const game = await this.store.findCurrent(ownerSessionId);
    return game ? this.envelope(game) : null;
  }

  async get(id: string, ownerSessionId: string): Promise<GameEnvelope> {
    const game = await this.store.findAuthorized(id, ownerSessionId);
    if (!game) throw new GameServiceError("NOT_FOUND", "Partida não encontrada para esta sessão.", 404);
    return this.envelope(game);
  }

  async act(id: string, ownerSessionId: string, input: unknown): Promise<GameEnvelope> {
    const command = validateCommand(input);
    await this.store.mutate(id, ownerSessionId, command.expectedRevision, command.actionId, (state) => {
      const action = { ...command.action, actionId: command.actionId, playerId: "human" };
      return transition(state, action);
    });
    return this.get(id, ownerSessionId);
  }

  async advance(id: string, ownerSessionId: string, input: unknown): Promise<GameEnvelope> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) throw new GameServiceError("BAD_REQUEST", "Comando inválido.", 400);
    const expected = (input as Record<string, unknown>).expectedRevision;
    if (!Number.isInteger(expected) || Number(expected) < 0) throw new GameServiceError("BAD_REQUEST", "expectedRevision inválida.", 400);
    let game = await this.store.findAuthorized(id, ownerSessionId);
    if (!game) throw new GameServiceError("NOT_FOUND", "Partida não encontrada para esta sessão.", 404);
    if (game.revision !== expected) throw new GameServiceError("REVISION_CONFLICT", "A partida foi atualizada por outra requisição.", 409);

    for (let step = 0; step < MAX_BOT_ACTIONS; step += 1) {
      const active = game.state.players[game.state.activePlayerIndex];
      if (!active || active.type !== "BOT" || game.state.phase === "FINISHED") break;
      const actionId = `server-bot-${game.revision}-${active.id}`;
      const result = await this.store.mutate(id, ownerSessionId, game.revision, actionId, (state) => {
        const current = state.players[state.activePlayerIndex];
        if (!current || current.type !== "BOT") throw new GameServiceError("REVISION_CONFLICT", "O turno automático já foi processado.", 409);
        const decision = chooseBasicBotAction(getPlayerView(state, current.id), current.id, { random: seededRandom(state.revision + 1) });
        if (!decision.action) throw new GameServiceError("INVALID_ACTION", `${current.name}: ${decision.reason}`, 422);
        return transition(state, { ...decision.action, actionId });
      });
      game = { ...game, revision: result.state.revision, state: result.state };
    }
    const active = game.state.players[game.state.activePlayerIndex];
    if (active?.type === "BOT" && game.state.phase !== "FINISHED") throw new GameServiceError("INVALID_ACTION", "O limite defensivo de ações automáticas foi atingido.", 503);
    return this.get(id, ownerSessionId);
  }

  async restart(id: string, ownerSessionId: string, input: unknown): Promise<GameEnvelope> {
    if (typeof input !== "object" || input === null || Array.isArray(input)) throw new GameServiceError("BAD_REQUEST", "Comando de reinício inválido.", 400);
    const command = input as Record<string, unknown>;
    if (!Number.isInteger(command.expectedRevision) || Number(command.expectedRevision) < 0) throw new GameServiceError("BAD_REQUEST", "expectedRevision inválida.", 400);
    const previous = await this.store.findAuthorized(id, ownerSessionId);
    if (!previous) throw new GameServiceError("NOT_FOUND", "Partida não encontrada para esta sessão.", 404);
    if (previous.revision !== command.expectedRevision) throw new GameServiceError("REVISION_CONFLICT", "A partida foi atualizada por outra requisição.", 409);
    return this.create(ownerSessionId, command.config, { id, expectedRevision: previous.revision });
  }

  async abandon(id: string, ownerSessionId: string, input: unknown): Promise<void> {
    if (typeof input !== "object" || input === null || !Number.isInteger((input as Record<string, unknown>).expectedRevision)) {
      throw new GameServiceError("BAD_REQUEST", "expectedRevision inválida.", 400);
    }
    await this.store.abandon(id, ownerSessionId, Number((input as Record<string, unknown>).expectedRevision));
  }
}

export const gameService = new GameService();
