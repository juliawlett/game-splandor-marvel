import { describe, expect, it } from "vitest";
import { applyGameAction, getPlayerView, initializeGame } from "../core";
import { cardCatalog } from "../data/catalog";
import { participants, setupGame } from "./fixtures";

describe("privacidade de reservas e projeções", () => {
  it("mantém reserva da mesa visível para todos", () => {
    const state = setupGame();
    const target = state.visibleCards[1][0]!;
    const result = applyGameAction(state, { type: "RESERVE_VISIBLE", playerId: "p1", actionId: "public", cardId: target.id });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const owner = getPlayerView(result.state, "p1").players[0]!.reservedCards[0]!;
    const opponent = getPlayerView(result.state, "p2").players[0]!.reservedCards[0]!;
    expect(owner).toEqual({ cardId: target.id, level: target.level, hidden: false });
    expect(opponent).toEqual(owner);
  });

  it("revela reserva do topo somente ao dono e mantém o nível público", () => {
    const state = setupGame();
    const target = state.decks[2][0]!;
    const result = applyGameAction(state, { type: "RESERVE_TOP", playerId: "p1", actionId: "secret", level: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(getPlayerView(result.state, "p1").players[0]!.reservedCards[0]).toEqual({ cardId: target.id, level: 2, hidden: true });
    expect(getPlayerView(result.state, "p2").players[0]!.reservedCards[0]).toEqual({ cardId: null, level: 2, hidden: true });
    const reserveEvent = result.events.find((event) => event.type === "CARD_RESERVED")!;
    expect(reserveEvent.payload).toEqual({ level: 2, hidden: true });
    expect(Object.hasOwn(reserveEvent.payload!, "cardId")).toBe(false);
  });

  it("projeta corretamente uma mistura de reservas públicas e ocultas", () => {
    const state = setupGame();
    const publicCard = state.visibleCards[1][0]!;
    const secretCard = state.decks[3][0]!;
    state.players[0]!.reservedCards = [
      { cardId: publicCard.id, hidden: false },
      { cardId: secretCard.id, hidden: true },
    ];
    const opponentView = getPlayerView(state, "p2").players[0]!.reservedCards;
    expect(opponentView).toEqual([
      { cardId: publicCard.id, level: 1, hidden: false },
      { cardId: null, level: 3, hidden: true },
    ]);
  });

  it("não expõe baralhos nem referências mutáveis do estado autoritativo", () => {
    const zero = { yellow: 0, blue: 0, orange: 0, purple: 0, red: 0 };
    const state = initializeGame(participants, cardCatalog, { seed: 3, locations: [
      { id: "loc", name: "Local", requiredBonuses: zero, infinityPoints: 3, claimedBy: null },
    ] });
    const view = getPlayerView(state, "p1");
    expect("decks" in view).toBe(false);
    view.visibleCards[1][0]!.name = "ALTERADO";
    view.visibleCards[1][0]!.cost.yellow = 999;
    view.locations[0]!.name = "ALTERADO";
    view.locations[0]!.requiredBonuses.yellow = 999;
    expect(state.visibleCards[1][0]!.name).not.toBe("ALTERADO");
    expect(state.visibleCards[1][0]!.cost.yellow).not.toBe(999);
    expect(state.locations[0]!.name).toBe("Local");
    expect(state.locations[0]!.requiredBonuses.yellow).toBe(0);
  });

  it("separa eventos retornados dos eventos persistidos", () => {
    const result = applyGameAction(setupGame(), { type: "TAKE_DIFFERENT", playerId: "p1", actionId: "take", colors: ["yellow", "blue", "red"] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    result.events[0]!.type = "ALTERADO";
    (result.events[0]!.payload!.colors as string[])[0] = "purple";
    expect(result.state.lastEvents[0]!.type).toBe("TOKENS_TAKEN");
    expect(result.state.lastEvents[0]!.payload!.colors).toEqual(["yellow", "blue", "red"]);
  });
});
