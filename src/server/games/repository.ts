import "server-only";
import { randomUUID } from "node:crypto";
import { GameSessionStatus, Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { GameAction, GameEvent, GameState } from "@/game/core";
import { getPrismaClient } from "@/server/database/prisma";
import { GameServiceError, unavailable } from "./errors";
import { parseGameSnapshot } from "./snapshot";

export interface StoredGame {
  id: string;
  ownerSessionId: string;
  status: GameSessionStatus;
  revision: number;
  state: GameState;
}

export interface MutationResult { state: GameState; events: GameEvent[]; action: GameAction }
export interface LoggedEvent { id: string; event: GameEvent }

export interface GameRepository {
  create(ownerSessionId: string, state: GameState, replaces?: { id: string; expectedRevision: number }): Promise<StoredGame>;
  findCurrent(ownerSessionId: string): Promise<StoredGame | null>;
  findAuthorized(id: string, ownerSessionId: string): Promise<StoredGame | null>;
  mutate(id: string, ownerSessionId: string, expectedRevision: number, actionId: string, change: (state: GameState) => MutationResult): Promise<MutationResult>;
  abandon(id: string, ownerSessionId: string, expectedRevision: number): Promise<void>;
  recentEvents(id: string): Promise<LoggedEvent[]>;
}

const json = (value: unknown): Prisma.InputJsonValue => structuredClone(value) as Prisma.InputJsonValue;

function stored(row: { id: string; ownerSessionId: string; status: GameSessionStatus; revision: number; stateJson: Prisma.JsonValue }): StoredGame {
  const state = parseGameSnapshot(row.stateJson);
  if (state.revision !== row.revision || state.id !== row.id) {
    throw new GameServiceError("INVALID_SNAPSHOT", "A revisão ou o ID do snapshot diverge do registro da partida.", 500);
  }
  return { id: row.id, ownerSessionId: row.ownerSessionId, status: row.status, revision: row.revision, state };
}

export class PrismaGameRepository implements GameRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  async create(ownerSessionId: string, state: GameState, replaces?: { id: string; expectedRevision: number }): Promise<StoredGame> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (replaces) {
          const replaced = await tx.gameSession.updateMany({
            where: { id: replaces.id, ownerSessionId, revision: replaces.expectedRevision, status: { in: [GameSessionStatus.ACTIVE, GameSessionStatus.FINISHED] } },
            data: { status: GameSessionStatus.RESTARTED },
          });
          if (replaced.count !== 1) throw new GameServiceError("REVISION_CONFLICT", "A partida foi atualizada antes do reinício.", 409);
        }
        await tx.gameSession.updateMany({
          where: { ownerSessionId, status: GameSessionStatus.ACTIVE },
          data: { status: GameSessionStatus.ABANDONED },
        });
        return tx.gameSession.create({
          data: { id: state.id, ownerSessionId, revision: state.revision, stateJson: json(state), schemaVersion: 1 },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return stored(row);
    } catch (error) { return unavailable(error); }
  }

  async findCurrent(ownerSessionId: string): Promise<StoredGame | null> {
    try {
      const row = await this.prisma.gameSession.findFirst({
        where: { ownerSessionId, status: { in: [GameSessionStatus.ACTIVE, GameSessionStatus.FINISHED] } },
        orderBy: { updatedAt: "desc" },
      });
      return row ? stored(row) : null;
    } catch (error) { return unavailable(error); }
  }

  async findAuthorized(id: string, ownerSessionId: string): Promise<StoredGame | null> {
    try {
      const row = await this.prisma.gameSession.findFirst({ where: { id, ownerSessionId } });
      return row ? stored(row) : null;
    } catch (error) { return unavailable(error); }
  }

  async mutate(id: string, ownerSessionId: string, expectedRevision: number, actionId: string, change: (state: GameState) => MutationResult): Promise<MutationResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.gameSession.findFirst({ where: { id, ownerSessionId } });
        if (!row) throw new GameServiceError("NOT_FOUND", "Partida não encontrada para esta sessão.", 404);
        if (row.status !== GameSessionStatus.ACTIVE) throw new GameServiceError("INVALID_ACTION", "Esta partida não aceita novas ações.", 409);
        if (row.revision !== expectedRevision) throw new GameServiceError("REVISION_CONFLICT", "A partida foi atualizada por outra requisição.", 409);
        const duplicate = await tx.gameActionLog.findUnique({ where: { gameSessionId_actionId: { gameSessionId: id, actionId } } });
        if (duplicate) throw new GameServiceError("DUPLICATE_ACTION", "Este comando já foi processado.", 409);
        const result = change(parseGameSnapshot(row.stateJson));
        if (result.state.revision !== expectedRevision + 1) throw new GameServiceError("INVALID_SNAPSHOT", "A transição não incrementou a revisão corretamente.", 500);
        const nextStatus = result.state.phase === "FINISHED" ? GameSessionStatus.FINISHED : GameSessionStatus.ACTIVE;
        const updated = await tx.gameSession.updateMany({
          where: { id, ownerSessionId, revision: expectedRevision, status: GameSessionStatus.ACTIVE },
          data: { revision: result.state.revision, stateJson: json(result.state), status: nextStatus, finishedAt: nextStatus === GameSessionStatus.FINISHED ? new Date() : null },
        });
        if (updated.count !== 1) throw new GameServiceError("REVISION_CONFLICT", "A partida foi atualizada por outra requisição.", 409);
        await tx.gameActionLog.create({
          data: {
            id: randomUUID(), gameSessionId: id, actionId, playerId: result.action.playerId,
            revision: result.state.revision, actionType: result.action.type,
            payload: json({ action: result.action, events: result.events }),
          },
        });
        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof GameServiceError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new GameServiceError("DUPLICATE_ACTION", "Este comando já foi processado.", 409);
      }
      return unavailable(error);
    }
  }

  async abandon(id: string, ownerSessionId: string, expectedRevision: number): Promise<void> {
    try {
      const updated = await this.prisma.gameSession.updateMany({
        where: { id, ownerSessionId, revision: expectedRevision, status: { in: [GameSessionStatus.ACTIVE, GameSessionStatus.FINISHED] } },
        data: { status: GameSessionStatus.ABANDONED },
      });
      if (updated.count !== 1) throw new GameServiceError("REVISION_CONFLICT", "A partida não existe ou foi atualizada.", 409);
    } catch (error) { return unavailable(error); }
  }

  async recentEvents(id: string): Promise<LoggedEvent[]> {
    try {
      const logs = await this.prisma.gameActionLog.findMany({ where: { gameSessionId: id }, orderBy: { revision: "desc" }, take: 30 });
      return logs.reverse().flatMap((log) => {
        const payload = log.payload as { events?: GameEvent[] };
        return Array.isArray(payload.events)
          ? payload.events.map((event, index) => ({ id: `${log.revision}-${index}-${event.type}`, event: structuredClone(event) }))
          : [];
      });
    } catch (error) { return unavailable(error); }
  }
}
