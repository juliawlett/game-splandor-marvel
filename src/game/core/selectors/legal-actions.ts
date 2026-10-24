import { suggestCardPayment } from "../rules/payment";
import { emptyResources, REGULAR_COLORS, totalTokens } from "../rules/resources";
import type { GameAction, RegularColor, ResourceMap } from "../types/game";
import type { GameView, PlayerView } from "./public-state";

export type ActionIdFactory = (label: string) => string;

function combinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  return items.flatMap((item, index) =>
    combinations(items.slice(index + 1), size - 1).map((rest) => [item, ...rest]),
  );
}

export function suggestTokenReturn(player: PlayerView): ResourceMap | null {
  let remaining = totalTokens(player.tokens) - 10;
  if (remaining <= 0) return emptyResources();
  const tokens = emptyResources();
  const ordered = [...REGULAR_COLORS, "gray"] as const;
  for (const color of ordered) {
    const amount = Math.min(remaining, player.tokens[color]);
    tokens[color] = amount;
    remaining -= amount;
  }
  return remaining === 0 ? tokens : null;
}

function locationIsEligible(view: GameView, player: PlayerView, locationId: string): boolean {
  const location = view.locations.find((item) => item.id === locationId);
  return Boolean(location && !location.claimedBy && REGULAR_COLORS.every(
    (color) => player.bonuses[color] >= location.requiredBonuses[color],
  ));
}

export function enumerateLegalActions(
  view: GameView,
  playerId: string,
  createActionId: ActionIdFactory = (label) => `${playerId}-${view.revision}-${label}`,
): GameAction[] {
  if (view.phase === "FINISHED" || view.activePlayerId !== playerId) return [];
  const player = view.players.find((item) => item.id === playerId);
  if (!player) return [];

  if (view.phase === "AWAITING_TOKEN_RETURN") {
    const tokens = suggestTokenReturn(player);
    return tokens ? [{ type: "RETURN_EXCESS_TOKENS", playerId, actionId: createActionId("return"), tokens }] : [];
  }

  if (view.phase === "AWAITING_LOCATION_CHOICE") {
    return view.locations
      .filter((location) => locationIsEligible(view, player, location.id))
      .map((location) => ({
        type: "CLAIM_LOCATION" as const,
        playerId,
        actionId: createActionId(`location-${location.id}`),
        locationId: location.id,
      }));
  }

  const actions: GameAction[] = [];
  const availableColors = REGULAR_COLORS.filter((color) => view.bank[color] > 0);
  const colorsRequired = Math.min(3, availableColors.length);
  for (const colors of combinations<RegularColor>(availableColors, colorsRequired)) {
    if (colors.length > 0) actions.push({
      type: "TAKE_DIFFERENT", playerId, actionId: createActionId(`different-${colors.join("-")}`), colors,
    });
  }
  for (const color of REGULAR_COLORS) {
    if (view.bank[color] >= 4) actions.push({
      type: "TAKE_SAME", playerId, actionId: createActionId(`same-${color}`), color,
    });
  }

  for (const level of [1, 2, 3] as const) {
    for (const card of view.visibleCards[level]) {
      const payment = suggestCardPayment(card, player.bonuses, player.tokens);
      if (payment) actions.push({
        type: "RECRUIT_VISIBLE", playerId, actionId: createActionId(`recruit-${card.id}`), cardId: card.id, payment,
      });
      if (player.reservedCards.length < 3) actions.push({
        type: "RESERVE_VISIBLE", playerId, actionId: createActionId(`reserve-${card.id}`), cardId: card.id,
      });
    }
    if (player.reservedCards.length < 3 && view.deckSizes[level] > 0) actions.push({
      type: "RESERVE_TOP", playerId, actionId: createActionId(`reserve-top-${level}`), level,
    });
  }

  for (const reserved of player.reservedCards) {
    if (!reserved.cardId) continue;
    const card = view.catalog.find((item) => item.id === reserved.cardId);
    if (card) {
      const payment = suggestCardPayment(card, player.bonuses, player.tokens);
      if (payment) actions.push({
        type: "RECRUIT_RESERVED", playerId, actionId: createActionId(`recruit-reserved-${card.id}`), cardId: card.id, payment,
      });
    }
  }

  return actions;
}
