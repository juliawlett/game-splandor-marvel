import rawCatalog from "../../../cartas.catalogo.json";
import { REGULAR_COLORS, type CardLevel, type CharacterCard, type RegularColor } from "../core/types/game";

export interface CatalogValidationResult {
  valid: boolean;
  errors: string[];
  cards: CharacterCard[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isIntegerAtLeast = (value: unknown, minimum: number): value is number => Number.isInteger(value) && Number(value) >= minimum;
const isRegularColor = (value: unknown): value is RegularColor => typeof value === "string" && REGULAR_COLORS.includes(value as RegularColor);

export function validateCatalog(input: unknown): CatalogValidationResult {
  const errors: string[] = [];
  if (!isRecord(input) || !Array.isArray(input.cards)) return { valid: false, errors: ["Catálogo deve possuir uma lista 'cards'."], cards: [] };
  const records = input.cards;
  if (records.length !== 90) errors.push(`Catálogo deve conter 90 cartas; encontrado: ${records.length}.`);
  const ids = new Set<string>();
  const cards: CharacterCard[] = [];

  records.forEach((entry, index) => {
    const path = `cards[${index}]`;
    if (!isRecord(entry)) { errors.push(`${path}: registro inválido.`); return; }
    const id = entry.id;
    if (typeof id !== "string" || !id.trim()) errors.push(`${path}.id: deve ser texto não vazio.`);
    else if (ids.has(id)) errors.push(`${path}.id: ID duplicado '${id}'.`);
    else ids.add(id);
    if (typeof entry.name !== "string" || !entry.name.trim()) errors.push(`${path}.name: deve ser texto não vazio.`);
    if (![1, 2, 3].includes(entry.level as number)) errors.push(`${path}.level: deve ser 1, 2 ou 3.`);
    if (!isRecord(entry.cost)) errors.push(`${path}.cost: deve conter as cinco cores comuns.`);
    else for (const color of REGULAR_COLORS) if (!isIntegerAtLeast(entry.cost[color], 0)) errors.push(`${path}.cost.${color}: deve ser inteiro não negativo.`);
    if (!isRegularColor(entry.bonusColor)) errors.push(`${path}.bonusColor: cor comum inválida.`);
    if (!isIntegerAtLeast(entry.infinityPoints, 0)) errors.push(`${path}.infinityPoints: deve ser inteiro não negativo.`);
    if (![0, 1, 2].includes(entry.avengersSymbols as number)) errors.push(`${path}.avengersSymbols: deve ser 0, 1 ou 2.`);
    const level = entry.level as CardLevel;
    if (typeof entry.grantsTimeStone !== "boolean" || entry.grantsTimeStone !== (level === 3)) errors.push(`${path}.grantsTimeStone: deve ser true apenas no nível 3.`);

    const cost = entry.cost;
    if (typeof id === "string" && typeof entry.name === "string" && [1, 2, 3].includes(level) && isRecord(cost) && REGULAR_COLORS.every((color) => isIntegerAtLeast(cost[color], 0)) && isRegularColor(entry.bonusColor) && isIntegerAtLeast(entry.infinityPoints, 0) && [0, 1, 2].includes(entry.avengersSymbols as number) && typeof entry.grantsTimeStone === "boolean") {
      cards.push({
        id, name: entry.name, level,
        cost: Object.fromEntries(REGULAR_COLORS.map((color) => [color, cost[color]])) as CharacterCard["cost"],
        bonusColor: entry.bonusColor,
        infinityPoints: entry.infinityPoints,
        avengersSymbols: entry.avengersSymbols as 0 | 1 | 2,
        grantsTimeStone: entry.grantsTimeStone,
        imageAsset: typeof entry.imageAsset === "string" ? entry.imageAsset : null,
        verification: typeof entry.verification === "string" ? entry.verification : "pendente",
      });
    }
  });

  const distribution = { 1: 0, 2: 0, 3: 0 };
  for (const card of cards) distribution[card.level] += 1;
  ([1, 2, 3] as const).forEach((level) => {
    const expected = level === 1 ? 40 : level === 2 ? 30 : 20;
    if (distribution[level] !== expected) errors.push(`Nível ${level} deve conter ${expected} cartas; encontrado: ${distribution[level]}.`);
  });
  return { valid: errors.length === 0, errors, cards };
}

const result = validateCatalog(rawCatalog);
if (!result.valid) throw new Error(`Catálogo inválido:\n${result.errors.join("\n")}`);
export const cardCatalog = result.cards;
