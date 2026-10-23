import { REGULAR_COLORS, TOKEN_COLORS, type Cost, type ResourceMap } from "../types/game";

export const emptyResources = (): ResourceMap => ({
  yellow: 0, blue: 0, orange: 0, purple: 0, red: 0, green: 0, gray: 0,
});

export const emptyCost = (): Cost => ({ yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 });

export const totalTokens = (tokens: ResourceMap): number =>
  TOKEN_COLORS.reduce((sum, color) => sum + tokens[color], 0);

export const initialSupplyFor = (players: number): ResourceMap => {
  const regular = players === 2 ? 4 : players === 3 ? 5 : 7;
  return { yellow: regular, blue: regular, orange: regular, purple: regular, red: regular, green: players, gray: 5 };
};

export const isNonNegativeIntegerMap = (map: ResourceMap): boolean =>
  TOKEN_COLORS.every((color) => Number.isInteger(map[color]) && map[color] >= 0);

export const resourceConservationHolds = (bank: ResourceMap, players: ResourceMap[], initial: ResourceMap): boolean =>
  TOKEN_COLORS.every((color) => bank[color] + players.reduce((sum, tokens) => sum + tokens[color], 0) === initial[color]);

export { REGULAR_COLORS, TOKEN_COLORS };
