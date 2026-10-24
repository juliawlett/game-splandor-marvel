import { REGULAR_COLORS, TOKEN_COLORS, type CharacterCard, type Cost, type ResourceMap } from "../types/game";
import { emptyResources, isNonNegativeIntegerMap } from "./resources";

export const discountedCost = (card: CharacterCard, bonuses: Cost): Cost =>
  Object.fromEntries(REGULAR_COLORS.map((color) => [color, Math.max(0, card.cost[color] - bonuses[color])])) as Cost;

export function validatePayment(cost: Cost, payment: ResourceMap, available: ResourceMap): string | null {
  if (!isNonNegativeIntegerMap(payment)) return "Pagamento deve usar inteiros não negativos.";
  if (payment.green !== 0) return "A Joia do Tempo não pode ser usada como pagamento.";
  if (TOKEN_COLORS.some((color) => payment[color] > available[color])) return "O jogador não possui as fichas informadas.";
  let grayRequired = 0;
  for (const color of REGULAR_COLORS) {
    if (payment[color] > cost[color]) return `Pagamento excessivo na cor ${color}.`;
    grayRequired += cost[color] - payment[color];
  }
  if (payment.gray !== grayRequired) return payment.gray < grayRequired ? "Pagamento insuficiente." : "Pagamento excessivo em curingas.";
  return null;
}

export function suggestPayment(cost: Cost, available: ResourceMap): ResourceMap | null {
  const payment = emptyResources();
  let grayNeeded = 0;

  for (const color of REGULAR_COLORS) {
    payment[color] = Math.min(cost[color], available[color]);
    grayNeeded += cost[color] - payment[color];
  }

  if (grayNeeded > available.gray) return null;
  payment.gray = grayNeeded;
  return payment;
}

export function suggestCardPayment(card: CharacterCard, bonuses: Cost, available: ResourceMap): ResourceMap | null {
  return suggestPayment(discountedCost(card, bonuses), available);
}

export interface CardAffordability {
  originalCost: Cost;
  discountedCost: Cost;
  suggestedPayment: ResourceMap | null;
  shortfall: Cost;
  grayAppliedToShortfall: number;
  missingAfterGray: number;
}

/** Explains a purchase using the same costs and wildcard allocation as the rules engine. */
export function describeCardAffordability(card: CharacterCard, bonuses: Cost, available: ResourceMap): CardAffordability {
  const finalCost = discountedCost(card, bonuses);
  const shortfall = Object.fromEntries(REGULAR_COLORS.map((color) => [color, Math.max(0, finalCost[color] - available[color])])) as Cost;
  const totalShortfall = REGULAR_COLORS.reduce((total, color) => total + shortfall[color], 0);
  const grayAppliedToShortfall = Math.min(available.gray, totalShortfall);
  return { originalCost: { ...card.cost }, discountedCost: finalCost, suggestedPayment: suggestPayment(finalCost, available), shortfall, grayAppliedToShortfall, missingAfterGray: totalShortfall - grayAppliedToShortfall };
}
