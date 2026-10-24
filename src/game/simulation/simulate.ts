import { chooseBasicBotAction } from "../bots";
import {
  applyGameAction,
  getPlayerView,
  initializeGame,
  resourceConservationHolds,
  seededRandom,
  type GameState,
} from "../core";
import { cardCatalog } from "../data/catalog";

export type SimulationStatus = "FINISHED" | "TURN_LIMIT" | "INTERRUPTED";

export interface SimulationResult {
  seed: number;
  players: number;
  status: SimulationStatus;
  turns: number;
  transitions: number;
  winnerIds: string[];
  reason: string | null;
}

function physicalCardIds(state: GameState): string[] {
  return [
    ...state.decks[1], ...state.decks[2], ...state.decks[3],
    ...state.visibleCards[1], ...state.visibleCards[2], ...state.visibleCards[3],
    ...state.players.flatMap((player) => player.reservedCards.map((reserved) =>
      state.catalog.find((card) => card.id === reserved.cardId)!,
    )),
    ...state.players.flatMap((player) => player.purchasedCardIds.map((id) =>
      state.catalog.find((card) => card.id === id)!,
    )),
  ].map((card) => card.id);
}

export function validateSimulationState(state: GameState): string | null {
  if (!resourceConservationHolds(state.bank, state.players.map((player) => player.tokens), state.initialSupply)) {
    return "Conservação de recursos violada.";
  }
  const cards = physicalCardIds(state);
  if (cards.length !== 90 || new Set(cards).size !== 90) return "Unicidade das cartas violada.";
  if (!state.players[state.activePlayerIndex]) return "Índice de jogador ativo inválido.";
  if (state.turnOrder.some((id, index) => state.players[index]?.id !== id)) return "Ordem de turnos inválida.";
  return null;
}

export function simulateBotGame(seed: number, players = 2, turnLimit = 500): SimulationResult {
  const participants = Array.from({ length: players }, (_, index) => ({
    id: `bot-${index + 1}`,
    name: `Robô ${index + 1}`,
    type: "BOT" as const,
  }));
  let state = initializeGame(participants, cardCatalog, { id: `simulation-${seed}`, seed });
  const random = seededRandom(seed ^ 0x9e3779b9);
  let transitions = 0;

  while (state.phase !== "FINISHED" && state.turnNumber <= turnLimit) {
    const integrityError = validateSimulationState(state);
    if (integrityError) return {
      seed, players, status: "INTERRUPTED", turns: state.turnNumber - 1,
      transitions, winnerIds: [], reason: integrityError,
    };
    const active = state.players[state.activePlayerIndex]!;
    const decision = chooseBasicBotAction(getPlayerView(state, active.id), active.id, { random });
    if (!decision.action) return {
      seed, players, status: "INTERRUPTED", turns: state.turnNumber - 1,
      transitions, winnerIds: [], reason: decision.reason,
    };
    const transition = applyGameAction(state, decision.action);
    if (!transition.ok) return {
      seed, players, status: "INTERRUPTED", turns: state.turnNumber - 1,
      transitions, winnerIds: [], reason: `${transition.error.code}: ${transition.error.message}`,
    };
    state = transition.state;
    transitions += 1;
  }

  const integrityError = validateSimulationState(state);
  if (integrityError) return {
    seed, players, status: "INTERRUPTED", turns: state.turnNumber - 1,
    transitions, winnerIds: [], reason: integrityError,
  };
  return {
    seed,
    players,
    status: state.phase === "FINISHED" ? "FINISHED" : "TURN_LIMIT",
    turns: state.turnNumber - 1,
    transitions,
    winnerIds: [...state.winnerIds],
    reason: state.phase === "FINISHED" ? null : `Limite de ${turnLimit} turnos atingido.`,
  };
}

export function runSimulationBatch(games = 100, turnLimit = 500): SimulationResult[] {
  return Array.from({ length: games }, (_, index) => simulateBotGame(index + 1, 2 + (index % 3), turnLimit));
}
