import { validateCatalog } from "../data/catalog";
import { emptyResources, initialSupplyFor } from "./rules/resources";
import type { CardLevel, CharacterCard, GameState, Location, ParticipantInput } from "./types/game";

export type RandomSource = () => number;

export function seededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

interface InitializeOptions {
  id?: string;
  seed?: number;
  random?: RandomSource;
  locations?: Location[];
}

export function initializeGame(participants: ParticipantInput[], catalog: CharacterCard[], options: InitializeOptions = {}): GameState {
  if (participants.length < 2 || participants.length > 4) throw new Error("INVALID_PARTICIPANTS: a partida exige de 2 a 4 participantes.");
  if (new Set(participants.map((participant) => participant.id)).size !== participants.length) throw new Error("DUPLICATE_PLAYER_ID: IDs de participantes devem ser únicos.");
  const catalogResult = validateCatalog({ cards: catalog });
  if (!catalogResult.valid) throw new Error(`INVALID_CATALOG: ${catalogResult.errors.join(" ")}`);
  const normalizedCatalog = structuredClone(catalogResult.cards);
  const random = options.random ?? seededRandom(options.seed ?? Date.now());
  const decks = {} as Record<CardLevel, CharacterCard[]>;
  const visibleCards = {} as Record<CardLevel, CharacterCard[]>;
  ([1, 2, 3] as const).forEach((level) => {
    const shuffled = shuffle(normalizedCatalog.filter((card) => card.level === level), random);
    visibleCards[level] = shuffled.splice(0, 4);
    decks[level] = shuffled;
  });
  const supply = initialSupplyFor(participants.length);
  return {
    id: options.id ?? "local-game", phase: "IN_PROGRESS", revision: 0,
    players: participants.map((participant, seatIndex) => ({ ...participant, seatIndex, tokens: emptyResources(), purchasedCardIds: [], reservedCards: [], claimedLocationIds: [] })),
    activePlayerIndex: 0, turnOrder: participants.map((participant) => participant.id), turnNumber: 1, completedRounds: 0,
    catalog: normalizedCatalog, decks, visibleCards, bank: { ...supply }, initialSupply: { ...supply },
    locations: (options.locations ?? []).map((location) => ({ ...location, requiredBonuses: { ...location.requiredBonuses } })),
    avengersOwnerId: null, actionHistory: [], lastEvents: [], finalRoundTriggeredAt: null, winnerIds: [],
  };
}
