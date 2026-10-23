import type { GameState } from "../types/game";
import { playerAvengersSymbols, playerBonuses, playerScore } from "../rules/derived";

export interface PlayerView {
  id: string;
  name: string;
  type: "HUMAN" | "BOT";
  seatIndex: number;
  tokens: GameState["bank"];
  purchasedCardIds: string[];
  reservedCards: Array<{ cardId: string | null; hidden: boolean }>;
  claimedLocationIds: string[];
  score: number;
  bonuses: ReturnType<typeof playerBonuses>;
  avengersSymbols: number;
}

export function getPlayerView(state: GameState, viewerId?: string) {
  return {
    id: state.id, phase: state.phase, revision: state.revision,
    activePlayerId: state.players[state.activePlayerIndex]?.id ?? null,
    bank: { ...state.bank }, visibleCards: state.visibleCards,
    deckSizes: { 1: state.decks[1].length, 2: state.decks[2].length, 3: state.decks[3].length },
    locations: state.locations, avengersOwnerId: state.avengersOwnerId,
    players: state.players.map((player): PlayerView => ({
      id: player.id, name: player.name, type: player.type, seatIndex: player.seatIndex,
      tokens: { ...player.tokens }, purchasedCardIds: [...player.purchasedCardIds],
      reservedCards: player.reservedCards.map((reserved) => ({ cardId: player.id === viewerId ? reserved.cardId : null, hidden: true })),
      claimedLocationIds: [...player.claimedLocationIds], score: playerScore(state, player),
      bonuses: playerBonuses(state, player), avengersSymbols: playerAvengersSymbols(state, player),
    })),
  };
}
