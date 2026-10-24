import type { CardLevel, CharacterCard, GameState } from "../types/game";
import { hasInfinityGauntlet, playerAvengersSymbols, playerBonuses, playerScore } from "../rules/derived";

export interface PlayerView {
  id: string;
  name: string;
  type: "HUMAN" | "BOT";
  seatIndex: number;
  tokens: GameState["bank"];
  purchasedCardIds: string[];
  reservedCards: Array<{ cardId: string | null; level: CardLevel; hidden: boolean }>;
  claimedLocationIds: string[];
  score: number;
  bonuses: ReturnType<typeof playerBonuses>;
  avengersSymbols: number;
  hasInfinityGauntlet: boolean;
}

export interface GameView {
  id: string;
  phase: GameState["phase"];
  revision: number;
  turnNumber: number;
  completedRounds: number;
  activePlayerId: string | null;
  bank: GameState["bank"];
  catalog: CharacterCard[];
  visibleCards: Record<CardLevel, CharacterCard[]>;
  deckSizes: Record<CardLevel, number>;
  locations: GameState["locations"];
  avengersOwnerId: string | null;
  finalRoundTriggeredAt: number | null;
  winnerIds: string[];
  players: PlayerView[];
}

export function getPlayerView(state: GameState, viewerId?: string): GameView {
  const catalogById = new Map(state.catalog.map((card) => [card.id, card]));
  const cloneCard = (card: CharacterCard): CharacterCard => ({ ...card, cost: { ...card.cost } });
  return {
    id: state.id, phase: state.phase, revision: state.revision,
    turnNumber: state.turnNumber, completedRounds: state.completedRounds,
    activePlayerId: state.players[state.activePlayerIndex]?.id ?? null,
    bank: { ...state.bank }, catalog: state.catalog.map(cloneCard), visibleCards: {
      1: state.visibleCards[1].map(cloneCard),
      2: state.visibleCards[2].map(cloneCard),
      3: state.visibleCards[3].map(cloneCard),
    },
    deckSizes: { 1: state.decks[1].length, 2: state.decks[2].length, 3: state.decks[3].length },
    locations: state.locations.map((location) => ({ ...location, requiredBonuses: { ...location.requiredBonuses } })),
    avengersOwnerId: state.avengersOwnerId,
    finalRoundTriggeredAt: state.finalRoundTriggeredAt,
    winnerIds: [...state.winnerIds],
    players: state.players.map((player): PlayerView => ({
      id: player.id, name: player.name, type: player.type, seatIndex: player.seatIndex,
      tokens: { ...player.tokens }, purchasedCardIds: [...player.purchasedCardIds],
      reservedCards: player.reservedCards.map((reserved) => ({
        cardId: !reserved.hidden || player.id === viewerId ? reserved.cardId : null,
        level: catalogById.get(reserved.cardId)!.level,
        hidden: reserved.hidden,
      })),
      claimedLocationIds: [...player.claimedLocationIds], score: playerScore(state, player),
      bonuses: playerBonuses(state, player), avengersSymbols: playerAvengersSymbols(state, player),
      hasInfinityGauntlet: hasInfinityGauntlet(state, player),
    })),
  };
}
