import { describe, expect, it } from "vitest";
import { initializeGame } from "../core";
import { cardCatalog } from "../data/catalog";

const participants = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `p${index}`, name: `Jogador ${index}`, type: index === 0 ? "HUMAN" as const : "BOT" as const }));

describe("inicialização da partida", () => {
  it.each([[2, 4], [3, 5], [4, 7]])("inicializa %i participantes com %i fichas comuns por cor", (count, stock) => {
    const state = initializeGame(participants(count), cardCatalog, { seed: 42 });
    expect(state.players).toHaveLength(count);
    expect(state.bank.yellow).toBe(stock);
    expect(state.bank.green).toBe(count);
    expect(state.bank.gray).toBe(5);
    expect(state.visibleCards[1]).toHaveLength(4);
    expect(state.visibleCards[2]).toHaveLength(4);
    expect(state.visibleCards[3]).toHaveLength(4);
    expect(state.decks[1]).toHaveLength(36);
    expect(state.decks[2]).toHaveLength(26);
    expect(state.decks[3]).toHaveLength(16);
  });

  it("usa a seed para produzir a mesma ordem", () => {
    const first = initializeGame(participants(2), cardCatalog, { seed: 81 });
    const second = initializeGame(participants(2), cardCatalog, { seed: 81 });
    expect(first.visibleCards).toEqual(second.visibleCards);
    expect(first.decks).toEqual(second.decks);
  });

  it("rejeita quantidade e IDs inválidos", () => {
    expect(() => initializeGame(participants(1), cardCatalog)).toThrow("INVALID_PARTICIPANTS");
    expect(() => initializeGame([{ id: "x", name: "A", type: "HUMAN" }, { id: "x", name: "B", type: "BOT" }], cardCatalog)).toThrow("DUPLICATE_PLAYER_ID");
  });
});
