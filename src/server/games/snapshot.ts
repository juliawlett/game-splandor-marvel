import { TOKEN_COLORS, getPlayerView, type GameState } from "@/game/core";
import { validateSimulationState } from "@/game/simulation/simulate";
import { GameServiceError } from "./errors";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function parseGameSnapshot(value: unknown): GameState {
  if (!isRecord(value) || typeof value.id !== "string" || !Number.isInteger(value.revision) || !Array.isArray(value.players)
    || !Array.isArray(value.catalog) || value.catalog.length !== 90 || !isRecord(value.decks)
    || !isRecord(value.visibleCards) || !isRecord(value.bank) || !Array.isArray(value.turnOrder)) {
    throw new GameServiceError("INVALID_SNAPSHOT", "O snapshot persistido não possui a estrutura esperada.", 500);
  }
  const bank = value.bank as Record<string, unknown>;
  if (!TOKEN_COLORS.every((color) => Number.isInteger(bank[color]) && Number(bank[color]) >= 0)) {
    throw new GameServiceError("INVALID_SNAPSHOT", "O snapshot persistido contém recursos inválidos.", 500);
  }
  const state = structuredClone(value) as unknown as GameState;
  try {
    if (validateSimulationState(state)) throw new Error(validateSimulationState(state)!);
    getPlayerView(state, state.players.find((player) => player.type === "HUMAN")?.id);
  } catch {
    throw new GameServiceError("INVALID_SNAPSHOT", "O snapshot persistido viola invariantes da partida.", 500);
  }
  return state;
}
