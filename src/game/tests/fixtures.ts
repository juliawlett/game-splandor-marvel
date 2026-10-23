import {
  emptyResources,
  initializeGame,
  type CharacterCard,
  type GameState,
  type ResourceMap,
} from "../core";
import { cardCatalog } from "../data/catalog";

export const participants = [
  { id: "p1", name: "Ana", type: "HUMAN" as const },
  { id: "p2", name: "Bot", type: "BOT" as const },
];

export const setupGame = () => initializeGame(participants, cardCatalog, { seed: 3 });

export const resources = (values: Partial<ResourceMap> = {}): ResourceMap => ({
  ...emptyResources(),
  ...values,
});

export function grantTokens(state: GameState, playerIndex: number, tokens: Partial<ResourceMap>): void {
  for (const [color, amount] of Object.entries(tokens) as Array<[keyof ResourceMap, number]>) {
    if (state.bank[color] < amount) throw new Error(`Fixture inválida: estoque insuficiente de ${color}.`);
    state.players[playerIndex]!.tokens[color] += amount;
    state.bank[color] -= amount;
  }
}

export function removeCardFromPlay(state: GameState, cardId: string): void {
  for (const level of [1, 2, 3] as const) {
    state.decks[level] = state.decks[level].filter((card) => card.id !== cardId);
    state.visibleCards[level] = state.visibleCards[level].filter((card) => card.id !== cardId);
  }
  for (const player of state.players) {
    player.reservedCards = player.reservedCards.filter((reserved) => reserved.cardId !== cardId);
    player.purchasedCardIds = player.purchasedCardIds.filter((id) => id !== cardId);
  }
}

export function giveCardToPlayer(state: GameState, playerIndex: number, cardId: string): void {
  removeCardFromPlay(state, cardId);
  state.players[playerIndex]!.purchasedCardIds.push(cardId);
}

export function placeVisibleCard(state: GameState, card: CharacterCard): void {
  removeCardFromPlay(state, card.id);
  state.visibleCards[card.level].unshift(card);
}

export function grantExactCardCost(state: GameState, playerIndex: number, card: CharacterCard): ResourceMap {
  const result = resources(card.cost);
  grantTokens(state, playerIndex, card.cost);
  return result;
}

export function allPhysicalCardIds(state: GameState): string[] {
  return [
    ...state.decks[1], ...state.decks[2], ...state.decks[3],
    ...state.visibleCards[1], ...state.visibleCards[2], ...state.visibleCards[3],
    ...state.players.flatMap((player) => player.reservedCards.map((reserved) => state.catalog.find((card) => card.id === reserved.cardId)!)),
    ...state.players.flatMap((player) => player.purchasedCardIds.map((id) => state.catalog.find((card) => card.id === id)!)),
  ].map((card) => card.id);
}
