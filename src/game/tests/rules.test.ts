import { describe, expect, it } from "vitest";
import { applyGameAction, discountedCost, emptyResources, getPlayerView, initializeGame, playerScore, resourceConservationHolds, type GameState, type ResourceMap } from "../core";
import { cardCatalog } from "../data/catalog";

const players = [{ id: "p1", name: "Ana", type: "HUMAN" as const }, { id: "p2", name: "Bot", type: "BOT" as const }];
const setup = () => initializeGame(players, cardCatalog, { seed: 3 });
const payment = (values: Partial<ResourceMap> = {}): ResourceMap => ({ ...emptyResources(), ...values });

function grantTokens(state: GameState, playerIndex: number, tokens: Partial<ResourceMap>) {
  for (const [color, amount] of Object.entries(tokens) as Array<[keyof ResourceMap, number]>) {
    state.players[playerIndex]!.tokens[color] += amount;
    state.bank[color] -= amount;
  }
}

describe("recursos e controle de turno", () => {
  it("retira três cores diferentes e avança o turno", () => {
    const result = applyGameAction(setup(), { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "a1", colors: ["yellow", "blue", "red"] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players[0]!.tokens).toMatchObject({ yellow: 1, blue: 1, red: 1 });
    expect(result.state.activePlayerIndex).toBe(1);
    expect(resourceConservationHolds(result.state.bank, result.state.players.map((player) => player.tokens), result.state.initialSupply)).toBe(true);
  });

  it("permite menos cores apenas quando o banco não oferece três", () => {
    const state = setup();
    for (const color of ["orange", "purple", "red"] as const) state.bank[color] = 0;
    const invalid = applyGameAction(state, { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "a1", colors: ["yellow"] });
    expect(invalid).toMatchObject({ ok: false, error: { code: "INVALID_TOKEN_SELECTION" } });
    const valid = applyGameAction(state, { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "a2", colors: ["yellow", "blue"] });
    expect(valid.ok).toBe(true);
  });

  it("exige quatro fichas no banco para retirar duas iguais", () => {
    const state = setup();
    state.bank.yellow = 3;
    expect(applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "a1", color: "yellow" })).toMatchObject({ ok: false, error: { code: "INSUFFICIENT_BANK" } });
    state.bank.yellow = 4;
    expect(applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "a2", color: "yellow" }).ok).toBe(true);
  });

  it("bloqueia jogador fora da vez e actionId duplicado", () => {
    expect(applyGameAction(setup(), { type: "TAKE_SAME", playerId: "p2", actionId: "a1", color: "yellow" })).toMatchObject({ ok: false, error: { code: "NOT_ACTIVE_PLAYER" } });
    const state = setup();
    state.actionHistory.push({ actionId: "repeat", playerId: "p1", turnNumber: 0, actionType: "TAKE_SAME" });
    expect(applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "repeat", color: "yellow" })).toMatchObject({ ok: false, error: { code: "DUPLICATE_ACTION" } });
  });

  it("exige devolução do excedente de dez antes de avançar", () => {
    const state = setup();
    grantTokens(state, 0, { yellow: 2, blue: 2, orange: 2, purple: 2, red: 1 });
    const taken = applyGameAction(state, { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "take", colors: ["yellow", "blue", "red"] });
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;
    expect(taken.state.phase).toBe("AWAITING_TOKEN_RETURN");
    expect(taken.state.activePlayerIndex).toBe(0);
    const returned = applyGameAction(taken.state, { type: "RETURN_EXCESS_TOKENS", playerId: "p1", actionId: "return", tokens: payment({ yellow: 1, blue: 1 }) });
    expect(returned.ok).toBe(true);
    if (returned.ok) expect(returned.state.activePlayerIndex).toBe(1);
  });
});

describe("reservas", () => {
  it("reserva carta pública, concede curinga e repõe a mesa", () => {
    const state = setup();
    const target = state.visibleCards[1][0]!;
    const deckBefore = state.decks[1].length;
    const result = applyGameAction(state, { type: "RESERVE_VISIBLE", playerId: "p1", actionId: "reserve", cardId: target.id });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players[0]!.reservedCards[0]!.cardId).toBe(target.id);
    expect(result.state.players[0]!.tokens.gray).toBe(1);
    expect(result.state.visibleCards[1]).toHaveLength(4);
    expect(result.state.decks[1]).toHaveLength(deckBefore - 1);
  });

  it("reserva topo como informação privada e respeita limite e baralho vazio", () => {
    const state = setup();
    const topId = state.decks[2][0]!.id;
    const result = applyGameAction(state, { type: "RESERVE_TOP", playerId: "p1", actionId: "top", level: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getPlayerView(result.state, "p2").players[0]!.reservedCards[0]!.cardId).toBeNull();
    expect(getPlayerView(result.state, "p1").players[0]!.reservedCards[0]!.cardId).toBe(topId);
    const limited = setup(); limited.players[0]!.reservedCards = [{ cardId: "1", hidden: true }, { cardId: "2", hidden: true }, { cardId: "3", hidden: true }];
    expect(applyGameAction(limited, { type: "RESERVE_TOP", playerId: "p1", actionId: "limit", level: 1 })).toMatchObject({ ok: false, error: { code: "RESERVATION_LIMIT" } });
    const empty = setup(); empty.decks[1] = [];
    expect(applyGameAction(empty, { type: "RESERVE_TOP", playerId: "p1", actionId: "empty", level: 1 })).toMatchObject({ ok: false, error: { code: "EMPTY_DECK" } });
  });
});

describe("recrutamento e efeitos", () => {
  it("calcula descontos e permite uma compra gratuita", () => {
    const state = setup();
    const target = state.visibleCards[1][0]!;
    for (const color of ["yellow", "blue", "orange", "purple", "red"] as const) {
      const count = target.cost[color];
      state.players[0]!.purchasedCardIds.push(...cardCatalog.filter((card) => card.bonusColor === color && card.id !== target.id).slice(0, count).map((card) => card.id));
    }
    expect(discountedCost(target, { yellow: 99, blue: 99, orange: 99, purple: 99, red: 99 })).toEqual({ yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 });
    const result = applyGameAction(state, { type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "free", cardId: target.id, payment: payment() });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.players[0]!.purchasedCardIds).toContain(target.id);
  });

  it("aceita curinga exato e rejeita pagamento insuficiente ou excessivo", () => {
    const state = setup();
    const target = state.visibleCards[1][0]!;
    const total = Object.values(target.cost).reduce((sum, value) => sum + value, 0);
    grantTokens(state, 0, { gray: total });
    const valid = applyGameAction(state, { type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "gray", cardId: target.id, payment: payment({ gray: total }) });
    expect(valid.ok).toBe(true);
    const poor = setup();
    expect(applyGameAction(poor, { type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "poor", cardId: poor.visibleCards[1][0]!.id, payment: payment() })).toMatchObject({ ok: false, error: { code: "INSUFFICIENT_FUNDS" } });
    const excessive = setup(); grantTokens(excessive, 0, { gray: 5 });
    expect(applyGameAction(excessive, { type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "much", cardId: excessive.visibleCards[1][0]!.id, payment: payment({ gray: 5 }) })).toMatchObject({ ok: false, error: { code: "INVALID_PAYMENT" } });
  });

  it("concede uma única Joia do Tempo na primeira carta de nível 3", () => {
    const state = setup();
    const target = state.visibleCards[3][0]!;
    for (const color of ["yellow", "blue", "orange", "purple", "red"] as const) state.players[0]!.purchasedCardIds.push(...cardCatalog.filter((card) => card.bonusColor === color && card.id !== target.id).slice(0, target.cost[color]).map((card) => card.id));
    const result = applyGameAction(state, { type: "RECRUIT_VISIBLE", playerId: "p1", actionId: "time", cardId: target.id, payment: payment() });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players[0]!.tokens.green).toBe(1);
    expect(result.events.some((event) => event.type === "TIME_STONE_GRANTED")).toBe(true);
  });
});

describe("Locais e vitória", () => {
  it("aguarda escolha quando há mais de um Local elegível", () => {
    const zero = { yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 };
    const state = initializeGame(players, cardCatalog, { seed: 3, locations: [
      { id: "loc-a", name: "Local A", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
      { id: "loc-b", name: "Local B", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
    ] });
    const action = applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "main", color: "yellow" });
    expect(action.ok).toBe(true);
    if (!action.ok) return;
    expect(action.state.phase).toBe("AWAITING_LOCATION_CHOICE");
    const choice = applyGameAction(action.state, { type: "CLAIM_LOCATION", playerId: "p1", actionId: "location", locationId: "loc-b" });
    expect(choice.ok).toBe(true);
    if (!choice.ok) return;
    expect(choice.state.locations.find((location) => location.id === "loc-b")?.claimedBy).toBe("p1");
    expect(playerScore(choice.state, choice.state.players[0]!)).toBe(3);
    expect(choice.state.activePlayerIndex).toBe(1);
  });

  it("encerra no fim da rodada e escolhe jogador elegível à Manopla", () => {
    const state = setup();
    const champion = state.players[0]!;
    champion.purchasedCardIds = (["yellow", "blue", "orange", "purple", "red"] as const).map((color) =>
      cardCatalog.filter((card) => card.bonusColor === color).sort((a, b) => b.infinityPoints - a.infinityPoints)[0]!.id,
    );
    champion.tokens.green = 1;
    state.bank.green -= 1;
    expect(playerScore(state, champion)).toBeGreaterThanOrEqual(16);
    const trigger = applyGameAction(state, { type: "TAKE_SAME", playerId: "p1", actionId: "trigger", color: "yellow" });
    expect(trigger.ok).toBe(true);
    if (!trigger.ok) return;
    expect(trigger.state.phase).toBe("FINAL_ROUND");
    const finish = applyGameAction(trigger.state, { type: "TAKE_DIFFERENT", playerId: "p2", actionId: "finish", colors: ["blue", "orange", "red"] });
    expect(finish.ok).toBe(true);
    if (!finish.ok) return;
    expect(finish.state.phase).toBe("FINISHED");
    expect(finish.state.winnerIds).toEqual(["p1"]);
  });
});
