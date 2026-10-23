export const REGULAR_COLORS = ["yellow", "blue", "orange", "purple", "red"] as const;
export const TOKEN_COLORS = [...REGULAR_COLORS, "green", "gray"] as const;

export type RegularColor = (typeof REGULAR_COLORS)[number];
export type TokenColor = (typeof TOKEN_COLORS)[number];
export type CardLevel = 1 | 2 | 3;
export type PlayerType = "HUMAN" | "BOT";
export type ResourceMap = Record<TokenColor, number>;
export type Cost = Record<RegularColor, number>;

export interface CharacterCard {
  id: string;
  name: string;
  level: CardLevel;
  cost: Cost;
  bonusColor: RegularColor;
  infinityPoints: number;
  avengersSymbols: 0 | 1 | 2;
  grantsTimeStone: boolean;
  imageAsset: string | null;
  verification: string;
}

export interface ParticipantInput {
  id: string;
  name: string;
  type: PlayerType;
}

export interface ReservedCard {
  cardId: string;
  hidden: boolean;
}

export interface PlayerState extends ParticipantInput {
  seatIndex: number;
  tokens: ResourceMap;
  purchasedCardIds: string[];
  reservedCards: ReservedCard[];
  claimedLocationIds: string[];
}

export interface Location {
  id: string;
  name: string;
  requiredBonuses: Cost;
  infinityPoints: 3;
  claimedBy: string | null;
}

export type GamePhase =
  | "IN_PROGRESS"
  | "AWAITING_TOKEN_RETURN"
  | "AWAITING_LOCATION_CHOICE"
  | "FINAL_ROUND"
  | "FINISHED";

export interface GameEvent {
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface ActionHistoryEntry {
  actionId: string;
  playerId: string;
  turnNumber: number;
  actionType: GameAction["type"];
}

export interface GameState {
  id: string;
  phase: GamePhase;
  revision: number;
  players: PlayerState[];
  activePlayerIndex: number;
  turnOrder: string[];
  turnNumber: number;
  completedRounds: number;
  catalog: CharacterCard[];
  decks: Record<CardLevel, CharacterCard[]>;
  visibleCards: Record<CardLevel, CharacterCard[]>;
  bank: ResourceMap;
  initialSupply: ResourceMap;
  locations: Location[];
  avengersOwnerId: string | null;
  actionHistory: ActionHistoryEntry[];
  lastEvents: GameEvent[];
  finalRoundTriggeredAt: number | null;
  winnerIds: string[];
}

interface ActionMeta { actionId: string; playerId: string }
export type GameAction =
  | (ActionMeta & { type: "TAKE_DIFFERENT"; colors: RegularColor[] })
  | (ActionMeta & { type: "TAKE_SAME"; color: RegularColor })
  | (ActionMeta & { type: "RESERVE_VISIBLE"; cardId: string })
  | (ActionMeta & { type: "RESERVE_TOP"; level: CardLevel })
  | (ActionMeta & { type: "RECRUIT_VISIBLE"; cardId: string; payment: ResourceMap })
  | (ActionMeta & { type: "RECRUIT_RESERVED"; cardId: string; payment: ResourceMap })
  | (ActionMeta & { type: "RETURN_EXCESS_TOKENS"; tokens: ResourceMap })
  | (ActionMeta & { type: "CLAIM_LOCATION"; locationId: string });

export type GameErrorCode =
  | "INVALID_PARTICIPANTS" | "DUPLICATE_PLAYER_ID" | "INVALID_CATALOG"
  | "INVALID_ACTION" | "INVALID_PLAYER_ID" | "NOT_ACTIVE_PLAYER" | "DUPLICATE_ACTION" | "INVALID_PHASE"
  | "INVALID_TOKEN_SELECTION" | "INSUFFICIENT_BANK" | "RESERVATION_LIMIT"
  | "CARD_NOT_FOUND" | "EMPTY_DECK" | "INVALID_PAYMENT" | "INSUFFICIENT_FUNDS"
  | "TOKEN_LIMIT" | "INVALID_TOKEN_RETURN" | "LOCATION_NOT_ELIGIBLE";

export interface GameError { code: GameErrorCode; message: string }
export type TransitionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: GameError };
