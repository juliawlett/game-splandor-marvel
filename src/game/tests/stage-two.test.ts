import { describe, expect, it } from "vitest";
import { chooseBasicBotAction } from "../bots";
import {
  applyGameAction,
  discountedCost,
  enumerateLegalActions,
  getPlayerView,
  playerBonuses,
  resourceConservationHolds,
  suggestCardPayment,
  suggestTokenReturn,
  type GameState,
} from "../core";
import { runSimulationBatch, simulateBotGame, validateSimulationState } from "../simulation/simulate";
import { createLocalGame, participantsForLocalGame } from "../../features/game/local/local-game";
import { grantTokens, setupGame } from "./fixtures";

describe("partida local", () => {
  it.each([1, 2, 3] as const)("inicializa uma pessoa contra %i robô(s)", (botCount) => {
    const state = createLocalGame({ humanName: " Júlia ", botCount, seed: 42 });
    expect(state.players).toHaveLength(botCount + 1);
    expect(state.players[0]).toMatchObject({ id: "human", name: "Júlia", type: "HUMAN" });
    expect(state.players.slice(1).every((player) => player.type === "BOT")).toBe(true);
    expect(validateSimulationState(state)).toBeNull();
  });

  it("reinicia sem carregar estado da partida anterior", () => {
    const first = createLocalGame({ humanName: "Ana", botCount: 1, seed: 10 });
    const changed = applyGameAction(first, { type: "TAKE_SAME", playerId: "human", actionId: "first", color: "yellow" });
    expect(changed.ok).toBe(true);
    const restarted = createLocalGame({ humanName: "Ana", botCount: 1, seed: 11 });
    expect(restarted.revision).toBe(0);
    expect(restarted.turnNumber).toBe(1);
    expect(restarted.players.every((player) => Object.values(player.tokens).every((amount) => amount === 0))).toBe(true);
    expect(restarted.visibleCards).not.toEqual(first.visibleCards);
  });

  it("gera participantes com IDs e nomes estáveis", () => {
    expect(participantsForLocalGame({ humanName: "", botCount: 3, seed: 1 }).map((player) => player.name))
      .toEqual(["Comandante", "Orion", "Vega", "Atlas"]);
  });
});

describe("pagamentos sugeridos e ações legais", () => {
  it("sugere fichas coloridas e completa apenas o necessário com curingas", () => {
    const state = setupGame();
    const card = state.visibleCards[1][0]!;
    const player = state.players[0]!;
    const cost = discountedCost(card, playerBonuses(state, player));
    const firstColor = Object.entries(cost).find(([, amount]) => amount > 0)![0] as keyof typeof cost;
    grantTokens(state, 0, { [firstColor]: 1, gray: 5 });
    const payment = suggestCardPayment(card, playerBonuses(state, player), player.tokens);
    expect(payment).not.toBeNull();
    expect(payment![firstColor]).toBe(Math.min(1, cost[firstColor]));
    expect(payment!.green).toBe(0);
    expect(Object.values(payment!).reduce((sum, amount) => sum + amount, 0))
      .toBe(Object.values(cost).reduce((sum, amount) => sum + amount, 0));
  });

  it("retorna null quando nem cores nem curingas cobrem o custo", () => {
    const state = setupGame();
    const card = state.visibleCards[3][0]!;
    expect(suggestCardPayment(card, playerBonuses(state, state.players[0]!), state.players[0]!.tokens)).toBeNull();
  });

  it("enumera somente ações aplicáveis para o jogador ativo", () => {
    const state = setupGame();
    const view = getPlayerView(state, "p1");
    const actions = enumerateLegalActions(view, "p1");
    expect(actions.some((action) => action.type === "TAKE_DIFFERENT")).toBe(true);
    expect(actions.some((action) => action.type === "TAKE_SAME")).toBe(true);
    expect(actions.filter((action) => action.type === "RESERVE_VISIBLE")).toHaveLength(12);
    expect(enumerateLegalActions(view, "p2")).toEqual([]);
    for (const action of actions) expect(applyGameAction(state, action).ok).toBe(true);
  });

  it("gera devolução exata sem incluir a Joia do Tempo", () => {
    const state = setupGame();
    grantTokens(state, 0, { yellow: 2, blue: 2, orange: 2, purple: 2, red: 2, green: 1 });
    state.phase = "AWAITING_TOKEN_RETURN";
    const view = getPlayerView(state, "p1");
    const returned = suggestTokenReturn(view.players[0]!);
    expect(returned?.green).toBe(0);
    expect(Object.values(returned!).reduce((sum, amount) => sum + amount, 0)).toBe(1);
    const actions = enumerateLegalActions(view, "p1");
    expect(actions).toHaveLength(1);
    expect(applyGameAction(state, actions[0]).ok).toBe(true);
  });
});

describe("robô básico", () => {
  it("decide usando sua visão e produz uma transição válida", () => {
    const state = setupGame();
    state.activePlayerIndex = 1;
    const view = getPlayerView(state, "p2");
    const decision = chooseBasicBotAction(view, "p2");
    expect(decision.action).not.toBeNull();
    const transition = applyGameAction(state, decision.action);
    expect(transition.ok).toBe(true);
    if (!transition.ok) return;
    expect(transition.state.activePlayerIndex).toBe(0);
    expect(resourceConservationHolds(transition.state.bank, transition.state.players.map((player) => player.tokens), transition.state.initialSupply)).toBe(true);
  });

  it("não recebe o ID de uma reserva secreta adversária", () => {
    const state = setupGame();
    const secret = state.decks[2][0]!;
    state.players[0]!.reservedCards.push({ cardId: secret.id, hidden: true });
    state.decks[2].shift();
    state.activePlayerIndex = 1;
    const view = getPlayerView(state, "p2");
    expect(view.players[0]!.reservedCards[0]!.cardId).toBeNull();
    const serializedCandidates = JSON.stringify(enumerateLegalActions(view, "p2"));
    expect(serializedCandidates).not.toContain(secret.id);
  });

  it("resolve automaticamente uma devolução obrigatória", () => {
    const state = setupGame();
    grantTokens(state, 1, { yellow: 2, blue: 2, orange: 2, purple: 2, red: 2, gray: 1 });
    state.activePlayerIndex = 1;
    state.phase = "AWAITING_TOKEN_RETURN";
    const decision = chooseBasicBotAction(getPlayerView(state, "p2"), "p2");
    expect(decision.action?.type).toBe("RETURN_EXCESS_TOKENS");
    expect(applyGameAction(state, decision.action).ok).toBe(true);
  });
});

describe("simulador", () => {
  it.each([2, 3, 4])("conclui uma partida reproduzível com %i jogadores", (players) => {
    const first = simulateBotGame(17, players, 500);
    const second = simulateBotGame(17, players, 500);
    expect(first).toEqual(second);
    expect(first.status).toBe("FINISHED");
    expect(first.winnerIds.length).toBeGreaterThan(0);
  });

  it("não inventa vitória quando o limite de turnos é atingido", () => {
    const result = simulateBotGame(4, 2, 1);
    expect(result.status).toBe("TURN_LIMIT");
    expect(result.winnerIds).toEqual([]);
  });

  it("executa um lote misto sem violar invariantes", () => {
    const results = runSimulationBatch(9, 500);
    expect(results).toHaveLength(9);
    expect(results.every((result) => result.status === "FINISHED")).toBe(true);
  });

  it("detecta estado inválido explicitamente", () => {
    const state: GameState = setupGame();
    state.bank.yellow += 1;
    expect(validateSimulationState(state)).toBe("Conservação de recursos violada.");
  });
});
