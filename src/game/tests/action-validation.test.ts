import { describe, expect, it } from "vitest";
import { applyGameAction } from "../core";
import { resources, setupGame } from "./fixtures";

describe("validação estrutural de ações", () => {
  it.each([
    ["objeto nulo", null],
    ["objeto arbitrário", { foo: "bar" }],
    ["actionId ausente", { type: "TAKE_SAME", playerId: "p1", color: "yellow" }],
    ["actionId vazio", { type: "TAKE_SAME", actionId: " ", playerId: "p1", color: "yellow" }],
    ["playerId vazio", { type: "TAKE_SAME", actionId: "a", playerId: "", color: "yellow" }],
    ["tipo desconhecido", { type: "TELEPORT", actionId: "a", playerId: "p1" }],
    ["pagamento ausente", { type: "RECRUIT_VISIBLE", actionId: "a", playerId: "p1", cardId: "card" }],
    ["nível inválido", { type: "RESERVE_TOP", actionId: "a", playerId: "p1", level: 4 }],
    ["cores inválidas", { type: "TAKE_DIFFERENT", actionId: "a", playerId: "p1", colors: ["green"] }],
    ["array ausente", { type: "TAKE_DIFFERENT", actionId: "a", playerId: "p1" }],
    ["cardId vazio", { type: "RESERVE_VISIBLE", actionId: "a", playerId: "p1", cardId: "" }],
    ["locationId nulo", { type: "CLAIM_LOCATION", actionId: "a", playerId: "p1", locationId: null }],
  ])("rejeita %s sem lançar exceção", (_label, action) => {
    const state = setupGame();
    const before = structuredClone(state);
    expect(() => applyGameAction(state, action)).not.toThrow();
    expect(applyGameAction(state, action)).toMatchObject({ ok: false, error: { code: "INVALID_ACTION" } });
    expect(state).toEqual(before);
  });

  it.each([
    ["valor negativo", resources({ red: -1 })],
    ["valor decimal", resources({ blue: 1.5 })],
    ["campo ausente", { yellow: 0, blue: 0, orange: 0, purple: 0, red: 0, green: 0 }],
    ["objeto nulo", null],
  ])("rejeita pagamento com %s", (_label, payment) => {
    const state = setupGame();
    const target = state.visibleCards[1][0]!;
    const result = applyGameAction(state, {
      type: "RECRUIT_VISIBLE", actionId: "pay", playerId: "p1", cardId: target.id, payment,
    });
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_ACTION" } });
  });

  it("distingue jogador inexistente de jogador fora da vez", () => {
    const unknown = applyGameAction(setupGame(), { type: "TAKE_SAME", actionId: "a", playerId: "ghost", color: "yellow" });
    expect(unknown).toMatchObject({ ok: false, error: { code: "INVALID_PLAYER_ID" } });
    const inactive = applyGameAction(setupGame(), { type: "TAKE_SAME", actionId: "b", playerId: "p2", color: "yellow" });
    expect(inactive).toMatchObject({ ok: false, error: { code: "NOT_ACTIVE_PLAYER" } });
  });

  it("não altera o estado original após transição válida", () => {
    const state = setupGame();
    const before = structuredClone(state);
    const result = applyGameAction(state, { type: "TAKE_SAME", actionId: "a", playerId: "p1", color: "yellow" });
    expect(result.ok).toBe(true);
    expect(state).toEqual(before);
    if (result.ok) expect(result.state).not.toBe(state);
  });
});
