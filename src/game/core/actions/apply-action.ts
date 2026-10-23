import { discountedCost, validatePayment } from "../rules/payment";
import { eligibleLocations, hasInfinityGauntlet, playerAvengersSymbols, playerBonuses, playerScore } from "../rules/derived";
import { REGULAR_COLORS, TOKEN_COLORS, totalTokens } from "../rules/resources";
import type { CardLevel, CharacterCard, GameAction, GameErrorCode, GameEvent, GameState, PlayerState, ResourceMap, TransitionResult } from "../types/game";
import { validateGameAction } from "./validate-action";

const failure = (code: GameErrorCode, message: string): TransitionResult => ({ ok: false, error: { code, message } });
const findPlayer = (state: GameState, id: string) => state.players.find((player) => player.id === id);
const activePlayer = (state: GameState) => state.players[state.activePlayerIndex]!;

function drawReplacement(state: GameState, level: CardLevel, events: GameEvent[]): void {
  const replacement = state.decks[level].shift();
  if (replacement) {
    state.visibleCards[level].push(replacement);
    events.push({ type: "CARD_REVEALED", payload: { cardId: replacement.id, level } });
  }
}

function claimLocation(state: GameState, player: PlayerState, locationId: string, events: GameEvent[]): void {
  const location = state.locations.find((item) => item.id === locationId)!;
  location.claimedBy = player.id;
  player.claimedLocationIds.push(location.id);
  events.push({ type: "LOCATION_CLAIMED", actorId: player.id, payload: { locationId } });
}

function chooseWinners(state: GameState, eligible: PlayerState[]): string[] {
  let contenders = [...eligible];
  const maxScore = Math.max(...contenders.map((player) => playerScore(state, player)));
  contenders = contenders.filter((player) => playerScore(state, player) === maxScore);
  if (contenders.length <= 1) return contenders.map((player) => player.id);
  const avengersOwner = contenders.find((player) => state.avengersOwnerId === player.id);
  if (avengersOwner) return [avengersOwner.id];
  const fewestCards = Math.min(...contenders.map((player) => player.purchasedCardIds.length));
  return contenders.filter((player) => player.purchasedCardIds.length === fewestCards).map((player) => player.id);
}

function advanceTurn(state: GameState, events: GameEvent[]): void {
  const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  const wrapped = nextIndex === 0;
  state.activePlayerIndex = nextIndex;
  state.turnNumber += 1;
  if (wrapped) state.completedRounds += 1;

  const eligible = state.players.filter((player) => hasInfinityGauntlet(state, player));
  if (state.finalRoundTriggeredAt === null && eligible.length > 0) {
    state.finalRoundTriggeredAt = wrapped ? state.completedRounds : state.completedRounds + 1;
    state.phase = "FINAL_ROUND";
    events.push({ type: "FINAL_ROUND_TRIGGERED", payload: { targetRound: state.finalRoundTriggeredAt } });
  } else if (state.finalRoundTriggeredAt !== null) {
    state.phase = "FINAL_ROUND";
  } else {
    state.phase = "IN_PROGRESS";
  }

  if (wrapped && state.finalRoundTriggeredAt !== null && state.completedRounds >= state.finalRoundTriggeredAt) {
    const finalEligible = state.players.filter((player) => hasInfinityGauntlet(state, player));
    if (finalEligible.length === 0) {
      state.finalRoundTriggeredAt = null;
      state.phase = "IN_PROGRESS";
      events.push({ type: "FINAL_ROUND_REVOKED" });
    } else {
      state.winnerIds = chooseWinners(state, finalEligible);
      state.phase = "FINISHED";
      events.push({ type: "MATCH_FINISHED", payload: { winnerIds: [...state.winnerIds] } });
    }
  }
  if (state.phase !== "FINISHED") events.push({ type: "TURN_STARTED", actorId: activePlayer(state).id, payload: { turnNumber: state.turnNumber } });
}

function resolveEndOfTurn(state: GameState, player: PlayerState, events: GameEvent[]): void {
  if (totalTokens(player.tokens) > 10) {
    state.phase = "AWAITING_TOKEN_RETURN";
    return;
  }
  const locations = eligibleLocations(state, player);
  if (locations.length > 1) {
    state.phase = "AWAITING_LOCATION_CHOICE";
    return;
  }
  if (locations.length === 1) claimLocation(state, player, locations[0]!.id, events);
  advanceTurn(state, events);
}

function updateAvengers(state: GameState, player: PlayerState, events: GameEvent[]): void {
  const symbols = playerAvengersSymbols(state, player);
  const owner = state.avengersOwnerId ? findPlayer(state, state.avengersOwnerId) : undefined;
  const ownerSymbols = owner ? playerAvengersSymbols(state, owner) : 0;
  if (symbols >= 3 && (!owner || symbols > ownerSymbols)) {
    const previousOwnerId = state.avengersOwnerId;
    state.avengersOwnerId = player.id;
    events.push({ type: "AVENGERS_TRANSFERRED", actorId: player.id, payload: { previousOwnerId } });
  }
}

function recruit(state: GameState, player: PlayerState, card: CharacterCard, payment: ResourceMap, events: GameEvent[]): TransitionResult | null {
  const cost = discountedCost(card, playerBonuses(state, player));
  const paymentError = validatePayment(cost, payment, player.tokens);
  if (paymentError) return failure(paymentError.includes("possui") || paymentError.includes("insuficiente") ? "INSUFFICIENT_FUNDS" : "INVALID_PAYMENT", paymentError);
  for (const color of TOKEN_COLORS) {
    player.tokens[color] -= payment[color];
    state.bank[color] += payment[color];
  }
  player.purchasedCardIds.push(card.id);
  events.push({ type: "CARD_RECRUITED", actorId: player.id, payload: { cardId: card.id, payment: { ...payment } } });
  if (card.grantsTimeStone && player.tokens.green === 0 && state.bank.green > 0) {
    player.tokens.green += 1;
    state.bank.green -= 1;
    events.push({ type: "TIME_STONE_GRANTED", actorId: player.id });
  }
  updateAvengers(state, player, events);
  return null;
}

function record(state: GameState, action: GameAction, events: GameEvent[]): TransitionResult {
  state.actionHistory.push({ actionId: action.actionId, playerId: action.playerId, turnNumber: state.turnNumber, actionType: action.type });
  state.revision += 1;
  state.lastEvents = structuredClone(events);
  return { ok: true, state, events: structuredClone(events) };
}

export function applyGameAction(current: GameState, input: unknown): TransitionResult {
  const validation = validateGameAction(input);
  if (!validation.valid) return failure("INVALID_ACTION", validation.message);
  const action = validation.action;
  if (current.phase === "FINISHED") return failure("INVALID_PHASE", "A partida já terminou.");
  if (current.actionHistory.some((entry) => entry.actionId === action.actionId)) return failure("DUPLICATE_ACTION", "Esta ação já foi processada.");
  if (!findPlayer(current, action.playerId)) return failure("INVALID_PLAYER_ID", "O jogador informado não pertence à partida.");
  if (activePlayer(current).id !== action.playerId) return failure("NOT_ACTIVE_PLAYER", "Somente o jogador ativo pode agir.");
  const isFollowUp = action.type === "RETURN_EXCESS_TOKENS" || action.type === "CLAIM_LOCATION";
  if (!isFollowUp && (current.phase === "AWAITING_TOKEN_RETURN" || current.phase === "AWAITING_LOCATION_CHOICE")) return failure("INVALID_PHASE", "Conclua a etapa obrigatória do turno antes de outra ação principal.");
  const state = structuredClone(current);
  const player = activePlayer(state);
  const events: GameEvent[] = [];

  if (action.type === "TAKE_DIFFERENT") {
    const unique = new Set(action.colors);
    const available = REGULAR_COLORS.filter((color) => state.bank[color] > 0).length;
    const required = Math.min(3, available);
    if (required === 0) return failure("INSUFFICIENT_BANK", "Não há fichas comuns disponíveis para coleta.");
    if (action.colors.length !== unique.size || action.colors.length !== required) return failure("INVALID_TOKEN_SELECTION", `É necessário escolher ${required} cores comuns diferentes disponíveis.`);
    if (action.colors.some((color) => !REGULAR_COLORS.includes(color) || state.bank[color] < 1)) return failure("INSUFFICIENT_BANK", "Uma das cores escolhidas não está disponível.");
    for (const color of action.colors) { state.bank[color] -= 1; player.tokens[color] += 1; }
    events.push({ type: "TOKENS_TAKEN", actorId: player.id, payload: { colors: [...action.colors] } });
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "TAKE_SAME") {
    if (!REGULAR_COLORS.includes(action.color)) return failure("INVALID_TOKEN_SELECTION", "Somente uma cor comum pode ser escolhida.");
    if (state.bank[action.color] < 4) return failure("INSUFFICIENT_BANK", "O banco precisa ter ao menos quatro fichas dessa cor antes da ação.");
    state.bank[action.color] -= 2; player.tokens[action.color] += 2;
    events.push({ type: "TOKENS_TAKEN", actorId: player.id, payload: { colors: [action.color, action.color] } });
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "RESERVE_VISIBLE" || action.type === "RESERVE_TOP") {
    if (player.reservedCards.length >= 3) return failure("RESERVATION_LIMIT", "Cada jogador pode manter no máximo três reservas.");
    let card: CharacterCard | undefined;
    const hidden = action.type === "RESERVE_TOP";
    if (action.type === "RESERVE_VISIBLE") {
      for (const level of [1, 2, 3] as const) {
        const index = state.visibleCards[level].findIndex((item) => item.id === action.cardId);
        if (index >= 0) { card = state.visibleCards[level].splice(index, 1)[0]; drawReplacement(state, level, events); break; }
      }
      if (!card) return failure("CARD_NOT_FOUND", "Carta pública não encontrada.");
    } else {
      card = state.decks[action.level].shift();
      if (!card) return failure("EMPTY_DECK", "Não há carta nesse baralho.");
    }
    player.reservedCards.push({ cardId: card.id, hidden });
    if (state.bank.gray > 0) { state.bank.gray -= 1; player.tokens.gray += 1; }
    events.push({
      type: "CARD_RESERVED",
      actorId: player.id,
      payload: hidden ? { level: card.level, hidden: true } : { cardId: card.id, level: card.level, hidden: false },
    });
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "RECRUIT_VISIBLE") {
    let card: CharacterCard | undefined;
    let cardLevel: CardLevel | undefined;
    for (const level of [1, 2, 3] as const) {
      card = state.visibleCards[level].find((item) => item.id === action.cardId);
      if (card) { cardLevel = level; break; }
    }
    if (!card || !cardLevel) return failure("CARD_NOT_FOUND", "Carta pública não encontrada.");
    const recruitmentError = recruit(state, player, card, action.payment, events);
    if (recruitmentError) return recruitmentError;
    state.visibleCards[cardLevel] = state.visibleCards[cardLevel].filter((item) => item.id !== card!.id);
    drawReplacement(state, cardLevel, events);
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "RECRUIT_RESERVED") {
    const reservedIndex = player.reservedCards.findIndex((item) => item.cardId === action.cardId);
    if (reservedIndex < 0) return failure("CARD_NOT_FOUND", "Carta reservada não encontrada para este jogador.");
    const card = state.catalog.find((item) => item.id === action.cardId)!;
    const recruitmentError = recruit(state, player, card, action.payment, events);
    if (recruitmentError) return recruitmentError;
    player.reservedCards.splice(reservedIndex, 1);
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "RETURN_EXCESS_TOKENS") {
    if (current.phase !== "AWAITING_TOKEN_RETURN") return failure("INVALID_PHASE", "A partida não aguarda devolução de fichas.");
    if (action.tokens.green !== 0 || TOKEN_COLORS.some((color) => !Number.isInteger(action.tokens[color]) || action.tokens[color] < 0 || action.tokens[color] > player.tokens[color])) return failure("INVALID_TOKEN_RETURN", "Devolução inválida; a Joia do Tempo não pode ser devolvida.");
    const returnTotal = totalTokens(action.tokens);
    if (returnTotal !== totalTokens(player.tokens) - 10) return failure("INVALID_TOKEN_RETURN", "Devolva exatamente o excedente para permanecer com dez fichas.");
    for (const color of TOKEN_COLORS) { player.tokens[color] -= action.tokens[color]; state.bank[color] += action.tokens[color]; }
    events.push({ type: "TOKENS_RETURNED", actorId: player.id, payload: { tokens: { ...action.tokens } } });
    resolveEndOfTurn(state, player, events);
  } else if (action.type === "CLAIM_LOCATION") {
    if (current.phase !== "AWAITING_LOCATION_CHOICE") return failure("INVALID_PHASE", "A partida não aguarda escolha de Local.");
    if (!eligibleLocations(state, player).some((location) => location.id === action.locationId)) return failure("LOCATION_NOT_ELIGIBLE", "O jogador não atende aos requisitos desse Local.");
    claimLocation(state, player, action.locationId, events);
    advanceTurn(state, events);
  }
  return record(state, action, events);
}
