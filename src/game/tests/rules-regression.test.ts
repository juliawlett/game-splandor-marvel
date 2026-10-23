import { describe, expect, it } from "vitest";
import {
  applyGameAction,
  discountedCost,
  hasInfinityGauntlet,
  initializeGame,
  playerAvengersSymbols,
  playerBonuses,
  playerScore,
  resourceConservationHolds,
  type GameState,
} from "../core";
import { cardCatalog } from "../data/catalog";
import {
  allPhysicalCardIds,
  giveCardToPlayer,
  grantExactCardCost,
  grantTokens,
  participants,
  placeVisibleCard,
  resources,
  setupGame,
} from "./fixtures";

const byId = (id: string) => cardCatalog.find((card) => card.id === id)!;

function expectConservation(state: GameState): void {
  expect(resourceConservationHolds(
    state.bank,
    state.players.map((player) => player.tokens),
    state.initialSupply,
  )).toBe(true);
}

function prepareRecruit(state: GameState, playerIndex: number, targetId: string) {
  const target = byId(targetId);
  placeVisibleCard(state, target);
  const cost = discountedCost(target, playerBonuses(state, state.players[playerIndex]!));
  const payment = resources(cost);
  grantTokens(state, playerIndex, cost);
  state.activePlayerIndex = playerIndex;
  return { target, payment };
}

describe("recursos e integridade das cartas", () => {
  it("bloqueia coleta vazia quando não há cores comuns no banco", () => {
    const state = setupGame();
    for (const color of ["yellow", "blue", "orange", "purple", "red"] as const) {
      grantTokens(state, 0, { [color]: 2 });
      grantTokens(state, 1, { [color]: 2 });
    }
    const before = structuredClone(state);
    const result = applyGameAction(state, { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "empty", colors: [] });
    expect(result.ok).toBe(false);
    expect(state).toEqual(before);
    expect(state.activePlayerIndex).toBe(0);
    expectConservation(state);
  });

  it("devolve o pagamento ao banco sem consumir bônus permanentes", () => {
    const state = setupGame();
    const target = state.visibleCards[1][0]!;
    for (const color of ["yellow", "blue", "orange", "purple", "red"] as const) {
      const bonusCards = cardCatalog
        .filter((card) => card.bonusColor === color && card.id !== target.id)
        .slice(0, target.cost[color]);
      bonusCards.forEach((card) => giveCardToPlayer(state, 0, card.id));
    }
    const bonusesBefore = [...state.players[0]!.purchasedCardIds];
    const result = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "free", cardId: target.id, payment: resources(),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players[0]!.purchasedCardIds).toEqual([...bonusesBefore, target.id]);
    expect(result.state.players[0]!.tokens).toEqual(resources());
    expectConservation(result.state);
  });

  it("aceita curingas exatos, rejeita verde e conserva o estoque", () => {
    const state = setupGame();
    const target = state.visibleCards[1][0]!;
    const total = Object.values(target.cost).reduce((sum, value) => sum + value, 0);
    grantTokens(state, 0, { gray: total });
    const result = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "wild", cardId: target.id,
      payment: resources({ gray: total }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.bank.gray).toBe(result.state.initialSupply.gray);
    expectConservation(result.state);

    const greenState = setupGame();
    grantTokens(greenState, 0, { green: 1 });
    const greenResult = applyGameAction(greenState, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "green", cardId: greenState.visibleCards[1][0]!.id,
      payment: resources({ green: 1 }),
    });
    expect(greenResult).toMatchObject({ ok: false, error: { code: "INVALID_PAYMENT" } });
    expectConservation(greenState);
  });

  it("mantém cada uma das 90 cartas em uma única zona após reserva e recrutamento", () => {
    const initial = setupGame();
    expect(allPhysicalCardIds(initial)).toHaveLength(90);
    expect(new Set(allPhysicalCardIds(initial))).toHaveLength(90);
    const target = initial.visibleCards[1][0]!;
    const reserved = applyGameAction(initial, { type: "RESERVE_VISIBLE", playerId: "p1", actionId: "reserve", cardId: target.id });
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    expect(new Set(allPhysicalCardIds(reserved.state))).toHaveLength(90);
    expect(reserved.state.visibleCards[1]).toHaveLength(4);

    const botTurn = applyGameAction(reserved.state, { type: "TAKE_SAME", playerId: "p2", actionId: "bot", color: "yellow" });
    expect(botTurn.ok).toBe(true);
    if (!botTurn.ok) return;
    const payment = grantExactCardCost(botTurn.state, 0, target);
    const recruited = applyGameAction(botTurn.state, {
      type: "RECRUIT_RESERVED", playerId: "p1", actionId: "recruit", cardId: target.id, payment,
    });
    expect(recruited.ok).toBe(true);
    if (!recruited.ok) return;
    expect(recruited.state.players[0]!.reservedCards).toHaveLength(0);
    expect(recruited.state.players[0]!.purchasedCardIds).toContain(target.id);
    expect(new Set(allPhysicalCardIds(recruited.state))).toHaveLength(90);
    expect(allPhysicalCardIds(recruited.state)).toHaveLength(90);
    expectConservation(recruited.state);
  });

  it("impede recrutar a reserva de outro jogador", () => {
    const state = setupGame();
    const target = state.visibleCards[1][0]!;
    const reserved = applyGameAction(state, { type: "RESERVE_VISIBLE", playerId: "p1", actionId: "reserve", cardId: target.id });
    expect(reserved.ok).toBe(true);
    if (!reserved.ok) return;
    const payment = grantExactCardCost(reserved.state, 1, target);
    const result = applyGameAction(reserved.state, {
      type: "RECRUIT_RESERVED", playerId: "p2", actionId: "steal", cardId: target.id, payment,
    });
    expect(result).toMatchObject({ ok: false, error: { code: "CARD_NOT_FOUND" } });
    expect(reserved.state.players[0]!.reservedCards[0]!.cardId).toBe(target.id);
  });

  it("preserva a ordem circular dos turnos", () => {
    const fourPlayers = Array.from({ length: 4 }, (_, index) => ({ id: `p${index}`, name: `P${index}`, type: "HUMAN" as const }));
    let state = initializeGame(fourPlayers, cardCatalog, { seed: 5 });
    const turnColors = ["yellow", "blue", "orange", "purple"] as const;
    for (let index = 0; index < 4; index += 1) {
      expect(state.players[state.activePlayerIndex]!.id).toBe(`p${index}`);
      const result = applyGameAction(state, { type: "TAKE_SAME", playerId: `p${index}`, actionId: `turn-${index}`, color: turnColors[index]! });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    expect(state.activePlayerIndex).toBe(0);
    expect(state.completedRounds).toBe(1);
    expect(state.turnOrder).toEqual(["p0", "p1", "p2", "p3"]);
  });
});

describe("Locais, Vingadores e Joia do Tempo", () => {
  it("conquista automaticamente apenas um Local elegível", () => {
    const zero = { yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 };
    const state = initializeGame(participants, cardCatalog, { seed: 3, locations: [
      { id: "only", name: "Único", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
    ] });
    const result = applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "main", color: "yellow" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.locations[0]!.claimedBy).toBe("p1");
    expect(result.state.players[0]!.claimedLocationIds).toEqual(["only"]);
  });

  it("não permite selecionar Local já conquistado", () => {
    const zero = { yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 };
    const state = initializeGame(participants, cardCatalog, { seed: 3, locations: [
      { id: "claimed", name: "Conquistado", requiredBonuses: zero, infinityPoints: 3, claimedBy: "p2" },
      { id: "available-a", name: "Disponível A", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
      { id: "available-b", name: "Disponível B", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
    ] });
    state.phase = "AWAITING_LOCATION_CHOICE";
    const result = applyGameAction(state, { type: "CLAIM_LOCATION", playerId: "p1", actionId: "claimed", locationId: "claimed" });
    expect(result).toMatchObject({ ok: false, error: { code: "LOCATION_NOT_ELIGIBLE" } });
    expect(state.locations[0]!.claimedBy).toBe("p2");
  });

  it("entrega o cartão ao primeiro jogador que alcança três símbolos", () => {
    const state = setupGame();
    const target = cardCatalog.find((card) => card.level === 1 && card.avengersSymbols === 1)!;
    const symbolTwo = cardCatalog.find((card) => card.avengersSymbols === 2 && card.id !== target.id)!;
    giveCardToPlayer(state, 0, symbolTwo.id);
    const recruitment = prepareRecruit(state, 0, target.id);
    const result = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "first-avenger", cardId: target.id, payment: recruitment.payment,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(playerAvengersSymbols(result.state, result.state.players[0]!)).toBe(3);
    expect(result.state.avengersOwnerId).toBe("p1");
    expect(result.events.some((event) => event.type === "AVENGERS_TRANSFERRED")).toBe(true);
  });

  it("mantém o portador em empate e transfere apenas quando ultrapassado", () => {
    const target = cardCatalog.find((card) => card.level === 1 && card.avengersSymbols === 1)!;
    const symbolTwo = cardCatalog.filter((card) => card.avengersSymbols === 2 && card.id !== target.id);
    const symbolOne = cardCatalog.filter((card) => card.avengersSymbols === 1 && card.id !== target.id);

    const tied = setupGame();
    giveCardToPlayer(tied, 0, symbolTwo[0]!.id);
    giveCardToPlayer(tied, 0, symbolOne[0]!.id);
    giveCardToPlayer(tied, 1, symbolTwo[1]!.id);
    tied.avengersOwnerId = "p1";
    const ownerScore = playerScore(tied, tied.players[0]!);
    const tieRecruit = prepareRecruit(tied, 1, target.id);
    const tieResult = applyGameAction(tied, {
      type: "RECRUIT_VISIBLE", playerId: "p2", actionId: "tie", cardId: target.id, payment: tieRecruit.payment,
    });
    expect(tieResult.ok).toBe(true);
    if (!tieResult.ok) return;
    expect(playerAvengersSymbols(tieResult.state, tieResult.state.players[1]!)).toBe(3);
    expect(tieResult.state.avengersOwnerId).toBe("p1");
    expect(playerScore(tieResult.state, tieResult.state.players[0]!)).toBe(ownerScore);

    const surpassed = setupGame();
    giveCardToPlayer(surpassed, 0, symbolTwo[0]!.id);
    giveCardToPlayer(surpassed, 0, symbolOne[0]!.id);
    giveCardToPlayer(surpassed, 1, symbolTwo[1]!.id);
    giveCardToPlayer(surpassed, 1, symbolOne[1]!.id);
    surpassed.avengersOwnerId = "p1";
    const oldOwnerScore = playerScore(surpassed, surpassed.players[0]!);
    const newOwnerScore = playerScore(surpassed, surpassed.players[1]!);
    const transferRecruit = prepareRecruit(surpassed, 1, target.id);
    const transfer = applyGameAction(surpassed, {
      type: "RECRUIT_VISIBLE", playerId: "p2", actionId: "transfer", cardId: target.id, payment: transferRecruit.payment,
    });
    expect(transfer.ok, transfer.ok ? "" : JSON.stringify(transfer.error)).toBe(true);
    if (!transfer.ok) return;
    expect(transfer.state.avengersOwnerId).toBe("p2");
    expect(playerScore(transfer.state, transfer.state.players[0]!)).toBe(oldOwnerScore - 3);
    expect(playerScore(transfer.state, transfer.state.players[1]!)).toBeGreaterThanOrEqual(newOwnerScore + 3);
  });

  it("concede a Joia do Tempo somente no primeiro recrutamento de nível 3", () => {
    const state = setupGame();
    const levelThree = cardCatalog.filter((card) => card.level === 3);
    const first = prepareRecruit(state, 0, levelThree[0]!.id);
    const firstResult = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "time-1", cardId: first.target.id, payment: first.payment,
    });
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) return;
    expect(firstResult.state.players[0]!.tokens.green).toBe(1);

    firstResult.state.activePlayerIndex = 0;
    const second = prepareRecruit(firstResult.state, 0, levelThree[1]!.id);
    const secondResult = applyGameAction(firstResult.state, {
      type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "time-2", cardId: second.target.id, payment: second.payment,
    });
    expect(secondResult.ok, secondResult.ok ? "" : JSON.stringify(secondResult.error)).toBe(true);
    if (!secondResult.ok) return;
    expect(secondResult.state.players[0]!.tokens.green).toBe(1);
    expect(secondResult.events.some((event) => event.type === "TIME_STONE_GRANTED")).toBe(false);
    expectConservation(secondResult.state);
  });

  it("não permite devolver a Joia do Tempo durante o descarte obrigatório", () => {
    const state = setupGame();
    grantTokens(state, 0, { yellow: 2, blue: 2, orange: 2, purple: 2, red: 2, green: 1 });
    state.phase = "AWAITING_TOKEN_RETURN";
    const before = structuredClone(state);
    const result = applyGameAction(state, {
      type: "RETURN_EXCESS_TOKENS", playerId: "p1", actionId: "green-return", tokens: resources({ green: 1 }),
    });
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_TOKEN_RETURN" } });
    expect(state).toEqual(before);
  });

  it("revoga a rodada final quando a transferência dos Vingadores remove a única elegibilidade", () => {
    const state = setupGame();
    ["SM-L1-012", "SM-L2-012", "SM-L3-007", "SM-L2-019", "SM-L3-016"].forEach((id) => giveCardToPlayer(state, 0, id));
    ["SM-L2-030", "SM-L1-035"].forEach((id) => giveCardToPlayer(state, 1, id));
    state.players[0]!.tokens.green = 1;
    state.bank.green -= 1;
    state.avengersOwnerId = "p1";
    state.phase = "FINAL_ROUND";
    state.finalRoundTriggeredAt = 1;
    state.completedRounds = 0;
    const target = cardCatalog.find((card) => card.level === 1 && card.avengersSymbols === 1 && !state.players.some((player) => player.purchasedCardIds.includes(card.id)))!;
    const recruitment = prepareRecruit(state, 1, target.id);
    expect(playerScore(state, state.players[0]!)).toBe(16);
    const result = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", playerId: "p2", actionId: "revoke", cardId: target.id, payment: recruitment.payment,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.avengersOwnerId).toBe("p2");
    expect(result.state.phase).toBe("IN_PROGRESS");
    expect(result.state.finalRoundTriggeredAt).toBeNull();
    expect(result.events.some((event) => event.type === "FINAL_ROUND_REVOKED")).toBe(true);
  });
});

const EQUAL_ONE = ["SM-L1-012", "SM-L3-004", "SM-L3-007", "SM-L3-014", "SM-L3-016"];
const EQUAL_TWO = ["SM-L1-027", "SM-L3-015", "SM-L3-013", "SM-L3-020", "SM-L3-008"];
const HIGH_ONE = ["SM-L2-026", "SM-L3-004", "SM-L2-013", "SM-L3-014", "SM-L3-016"];
const LOW_TWO = ["SM-L1-012", "SM-L3-015", "SM-L3-007", "SM-L2-019", "SM-L3-008"];
const AVENGERS_ONE = ["SM-L1-012", "SM-L3-004", "SM-L3-007", "SM-L2-019", "SM-L3-016", "SM-L1-034", "SM-L1-035"];
const AVENGERS_TWO = ["SM-L2-016", "SM-L3-015", "SM-L3-013", "SM-L3-010", "SM-L3-005"];

function finalRoundFixture(firstCards: string[], secondCards: string[], avengersOwnerId: string | null = null): GameState {
  const state = setupGame();
  firstCards.forEach((id) => giveCardToPlayer(state, 0, id));
  secondCards.forEach((id) => giveCardToPlayer(state, 1, id));
  state.players[0]!.tokens.green = 1;
  state.players[1]!.tokens.green = 1;
  state.bank.green -= 2;
  state.avengersOwnerId = avengersOwnerId;
  state.phase = "FINAL_ROUND";
  state.finalRoundTriggeredAt = 1;
  state.completedRounds = 0;
  state.activePlayerIndex = 1;
  return state;
}

function finishRound(state: GameState) {
  return applyGameAction(state, {
    type: "TAKE_DIFFERENT", playerId: "p2", actionId: "finish", colors: ["yellow", "blue", "red"],
  });
}

describe("encerramento e desempates", () => {
  it("exige simultaneamente 16 pontos, cinco bônus e a Joia do Tempo", () => {
    const eligible = setupGame();
    HIGH_ONE.forEach((id) => giveCardToPlayer(eligible, 0, id));
    eligible.players[0]!.tokens.green = 1;
    eligible.bank.green -= 1;
    expect(hasInfinityGauntlet(eligible, eligible.players[0]!)).toBe(true);

    const withoutTime = structuredClone(eligible);
    withoutTime.players[0]!.tokens.green = 0;
    withoutTime.bank.green += 1;
    expect(hasInfinityGauntlet(withoutTime, withoutTime.players[0]!)).toBe(false);

    const lowScore = setupGame();
    for (const color of ["yellow", "blue", "orange", "purple", "red"] as const) {
      const card = cardCatalog.filter((item) => item.bonusColor === color).sort((a, b) => a.infinityPoints - b.infinityPoints)[0]!;
      giveCardToPlayer(lowScore, 0, card.id);
    }
    lowScore.players[0]!.tokens.green = 1;
    lowScore.bank.green -= 1;
    expect(playerScore(lowScore, lowScore.players[0]!)).toBeLessThan(16);
    expect(hasInfinityGauntlet(lowScore, lowScore.players[0]!)).toBe(false);

    const missingBonus = structuredClone(eligible);
    const removedId = missingBonus.players[0]!.purchasedCardIds.find((id) => byId(id).bonusColor === "yellow")!;
    missingBonus.players[0]!.purchasedCardIds = missingBonus.players[0]!.purchasedCardIds.filter((id) => id !== removedId);
    expect(hasInfinityGauntlet(missingBonus, missingBonus.players[0]!)).toBe(false);
  });

  it("desempata por maior pontuação", () => {
    const result = finishRound(finalRoundFixture(HIGH_ONE, LOW_TWO));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.winnerIds).toEqual(["p1"]);
  });

  it("desempata pelo cartão dos Vingadores quando a pontuação total empata", () => {
    const state = finalRoundFixture(AVENGERS_ONE, AVENGERS_TWO, "p1");
    expect(playerScore(state, state.players[0]!)).toBe(playerScore(state, state.players[1]!));
    const result = finishRound(state);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.winnerIds).toEqual(["p1"]);
  });

  it("desempata pela menor quantidade de cartas quando ninguém possui Vingadores", () => {
    const extraZeroPointCard = cardCatalog.find((card) => card.infinityPoints === 0 && !EQUAL_ONE.includes(card.id) && !EQUAL_TWO.includes(card.id))!;
    const state = finalRoundFixture(EQUAL_ONE, [...EQUAL_TWO, extraZeroPointCard.id]);
    expect(playerScore(state, state.players[0]!)).toBe(playerScore(state, state.players[1]!));
    const result = finishRound(state);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.winnerIds).toEqual(["p1"]);
  });

  it("declara vitória compartilhada quando todos os critérios empatam", () => {
    const state = finalRoundFixture(EQUAL_ONE, EQUAL_TWO);
    const result = finishRound(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.phase).toBe("FINISHED");
    expect(result.state.winnerIds).toEqual(["p1", "p2"]);
    const afterFinish = applyGameAction(result.state, { type: "TAKE_SAME", playerId: "p1", actionId: "late", color: "yellow" });
    expect(afterFinish).toMatchObject({ ok: false, error: { code: "INVALID_PHASE" } });
  });
});
