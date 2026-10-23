import { describe, expect, it } from "vitest";
import rawCatalog from "../../../cartas.catalogo.json";
import { cardCatalog, validateCatalog } from "../data/catalog";

describe("catálogo de personagens", () => {
  it("valida as 90 cartas e a distribuição 40/30/20", () => {
    const result = validateCatalog(rawCatalog);
    expect(result.valid).toBe(true);
    expect(cardCatalog).toHaveLength(90);
    expect(cardCatalog.filter((card) => card.level === 1)).toHaveLength(40);
    expect(cardCatalog.filter((card) => card.level === 2)).toHaveLength(30);
    expect(cardCatalog.filter((card) => card.level === 3)).toHaveLength(20);
  });

  it("produz erros específicos para ID duplicado e custo inválido", () => {
    const broken = structuredClone(rawCatalog);
    broken.cards[1]!.id = broken.cards[0]!.id;
    broken.cards[2]!.cost.yellow = -1;
    const result = validateCatalog(broken);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("ID duplicado"),
      expect.stringContaining("cost.yellow"),
    ]));
  });
});
