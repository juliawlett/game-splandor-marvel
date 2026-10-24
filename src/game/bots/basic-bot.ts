import {
  REGULAR_COLORS,
  discountedCost,
  enumerateLegalActions,
  type CharacterCard,
  type GameAction,
  type GameView,
  type PlayerView,
  type RandomSource,
  type RegularColor,
} from "../core";

export interface BotDecision {
  action: GameAction | null;
  candidatesEvaluated: number;
  reason: string;
}

export interface BotDecisionOptions {
  random?: RandomSource;
}

function cardForAction(view: GameView, action: GameAction): CharacterCard | undefined {
  if (!("cardId" in action)) return undefined;
  return view.catalog.find((card) => card.id === action.cardId);
}

function missingBonusColors(player: PlayerView): Set<RegularColor> {
  return new Set(REGULAR_COLORS.filter((color) => player.bonuses[color] === 0));
}

function targetNeed(view: GameView, player: PlayerView, color: RegularColor): number {
  const targets = [
    ...view.visibleCards[1],
    ...view.visibleCards[2],
    ...view.visibleCards[3],
    ...player.reservedCards.flatMap((reserved) => {
      const card = reserved.cardId ? view.catalog.find((item) => item.id === reserved.cardId) : undefined;
      return card ? [card] : [];
    }),
  ];
  return targets.reduce((highest, card) => {
    const remaining = discountedCost(card, player.bonuses)[color] - player.tokens[color];
    return Math.max(highest, remaining);
  }, 0);
}

function scoreAction(view: GameView, player: PlayerView, action: GameAction): number {
  if (action.type === "RETURN_EXCESS_TOKENS" || action.type === "CLAIM_LOCATION") return 10_000;

  if (action.type === "RECRUIT_VISIBLE" || action.type === "RECRUIT_RESERVED") {
    const card = cardForAction(view, action)!;
    const newColor = missingBonusColors(player).has(card.bonusColor) ? 15 : 0;
    const timeValue = card.grantsTimeStone && player.tokens.green === 0 ? 28 : 0;
    const avengersValue = card.avengersSymbols * 7;
    const reservedValue = action.type === "RECRUIT_RESERVED" ? 2 : 0;
    return 100 + card.infinityPoints * 18 + card.level * 5 + newColor + timeValue + avengersValue + reservedValue;
  }

  if (action.type === "TAKE_DIFFERENT") {
    return 40 + action.colors.reduce((sum, color) => sum + Math.max(0, targetNeed(view, player, color)) * 4, 0);
  }

  if (action.type === "TAKE_SAME") {
    return 42 + Math.max(0, targetNeed(view, player, action.color)) * 7;
  }

  if (action.type === "RESERVE_VISIBLE") {
    const card = cardForAction(view, action)!;
    const missingColor = missingBonusColors(player).has(card.bonusColor) ? 4 : 0;
    return 18 + card.infinityPoints * 6 + card.level * 2 + missingColor;
  }

  return 8 + action.level;
}

export function chooseBasicBotAction(
  view: GameView,
  botId: string,
  options: BotDecisionOptions = {},
): BotDecision {
  const candidates = enumerateLegalActions(view, botId);
  const player = view.players.find((item) => item.id === botId);
  if (!player || candidates.length === 0) {
    return { action: null, candidatesEvaluated: candidates.length, reason: "Nenhuma ação legal encontrada." };
  }

  const ranked = candidates
    .map((action) => ({ action, score: scoreAction(view, player, action), tie: options.random?.() ?? 0 }))
    .sort((left, right) => right.score - left.score || right.tie - left.tie || left.action.actionId.localeCompare(right.action.actionId));
  const selected = ranked[0]!;
  return {
    action: selected.action,
    candidatesEvaluated: candidates.length,
    reason: `Ação escolhida com avaliação ${selected.score}.`,
  };
}
