import { REGULAR_COLORS, TOKEN_COLORS, type CharacterCard, type Cost, type ResourceMap } from "../types/game";
import { isNonNegativeIntegerMap } from "./resources";

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
