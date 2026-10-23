import { REGULAR_COLORS, type CharacterCard, type Cost, type GameState, type PlayerState } from "../types/game";
import { emptyCost } from "./resources";

export const purchasedCards = (state: GameState, player: PlayerState): CharacterCard[] => {
  const allKnown = new Map(state.catalog.map((card) => [card.id, card]));
  return player.purchasedCardIds.map((id) => allKnown.get(id)).filter((card): card is CharacterCard => Boolean(card));
};

export const playerBonuses = (state: GameState, player: PlayerState): Cost => {
  const bonuses = emptyCost();
  for (const card of purchasedCards(state, player)) bonuses[card.bonusColor] += 1;
  return bonuses;
};

export const playerAvengersSymbols = (state: GameState, player: PlayerState): number =>
  purchasedCards(state, player).reduce((sum, card) => sum + card.avengersSymbols, 0);

export const playerScore = (state: GameState, player: PlayerState): number => {
  const cardPoints = purchasedCards(state, player).reduce((sum, card) => sum + card.infinityPoints, 0);
  const locationPoints = state.locations.filter((location) => location.claimedBy === player.id).reduce((sum, location) => sum + location.infinityPoints, 0);
  return cardPoints + locationPoints + (state.avengersOwnerId === player.id ? 3 : 0);
};

export const hasInfinityGauntlet = (state: GameState, player: PlayerState): boolean => {
  const bonuses = playerBonuses(state, player);
  return playerScore(state, player) >= 16 && REGULAR_COLORS.every((color) => bonuses[color] >= 1) && player.tokens.green === 1;
};

export const eligibleLocations = (state: GameState, player: PlayerState) => {
  const bonuses = playerBonuses(state, player);
  return state.locations.filter((location) => !location.claimedBy && REGULAR_COLORS.every((color) => bonuses[color] >= location.requiredBonuses[color]));
};
