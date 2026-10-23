import {
  REGULAR_COLORS,
  TOKEN_COLORS,
  type CardLevel,
  type GameAction,
  type RegularColor,
  type ResourceMap,
} from "../types/game";

export type ActionValidationResult =
  | { valid: true; action: GameAction }
  | { valid: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isRegularColor = (value: unknown): value is RegularColor =>
  typeof value === "string" && REGULAR_COLORS.includes(value as RegularColor);

const isCardLevel = (value: unknown): value is CardLevel =>
  value === 1 || value === 2 || value === 3;

const isResourceMap = (value: unknown): value is ResourceMap =>
  isRecord(value) && TOKEN_COLORS.every((color) => Number.isInteger(value[color]) && Number(value[color]) >= 0);

export function validateGameAction(value: unknown): ActionValidationResult {
  if (!isRecord(value)) return { valid: false, message: "A ação deve ser um objeto." };
  if (!isNonEmptyString(value.actionId)) return { valid: false, message: "actionId deve ser um identificador não vazio." };
  if (!isNonEmptyString(value.playerId)) return { valid: false, message: "playerId deve ser um identificador não vazio." };
  if (!isNonEmptyString(value.type)) return { valid: false, message: "O tipo da ação é obrigatório." };

  const meta = { actionId: value.actionId, playerId: value.playerId };
  switch (value.type) {
    case "TAKE_DIFFERENT":
      if (!Array.isArray(value.colors) || value.colors.length === 0 || !value.colors.every(isRegularColor)) {
        return { valid: false, message: "TAKE_DIFFERENT exige uma lista não vazia de cores comuns válidas." };
      }
      return { valid: true, action: { ...meta, type: value.type, colors: [...value.colors] } };
    case "TAKE_SAME":
      if (!isRegularColor(value.color)) return { valid: false, message: "TAKE_SAME exige uma cor comum válida." };
      return { valid: true, action: { ...meta, type: value.type, color: value.color } };
    case "RESERVE_VISIBLE":
      if (!isNonEmptyString(value.cardId)) return { valid: false, message: "RESERVE_VISIBLE exige um cardId válido." };
      return { valid: true, action: { ...meta, type: value.type, cardId: value.cardId } };
    case "RESERVE_TOP":
      if (!isCardLevel(value.level)) return { valid: false, message: "RESERVE_TOP exige nível 1, 2 ou 3." };
      return { valid: true, action: { ...meta, type: value.type, level: value.level } };
    case "RECRUIT_VISIBLE":
    case "RECRUIT_RESERVED":
      if (!isNonEmptyString(value.cardId)) return { valid: false, message: `${value.type} exige um cardId válido.` };
      if (!isResourceMap(value.payment)) return { valid: false, message: `${value.type} exige um pagamento completo com inteiros não negativos.` };
      return { valid: true, action: { ...meta, type: value.type, cardId: value.cardId, payment: { ...value.payment } } };
    case "RETURN_EXCESS_TOKENS":
      if (!isResourceMap(value.tokens)) return { valid: false, message: "RETURN_EXCESS_TOKENS exige um mapa completo com inteiros não negativos." };
      return { valid: true, action: { ...meta, type: value.type, tokens: { ...value.tokens } } };
    case "CLAIM_LOCATION":
      if (!isNonEmptyString(value.locationId)) return { valid: false, message: "CLAIM_LOCATION exige um locationId válido." };
      return { valid: true, action: { ...meta, type: value.type, locationId: value.locationId } };
    default:
      return { valid: false, message: `Tipo de ação desconhecido: '${value.type}'.` };
  }
}
