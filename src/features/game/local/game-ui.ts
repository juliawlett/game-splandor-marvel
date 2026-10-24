import type { RegularColor, TokenColor } from "@/game/core";

export const RESOURCE_LABELS: Record<TokenColor, string> = {
  yellow: "Mente",
  blue: "Espaço",
  orange: "Alma",
  purple: "Poder",
  red: "Realidade",
  green: "Tempo",
  gray: "S.H.I.E.L.D.",
};

export const REGULAR_RESOURCE_ENTRIES = [
  ["yellow", "Mente"],
  ["blue", "Espaço"],
  ["orange", "Alma"],
  ["purple", "Poder"],
  ["red", "Realidade"],
] as const satisfies ReadonlyArray<readonly [RegularColor, string]>;

export const TOKEN_RESOURCE_ENTRIES = [
  ...REGULAR_RESOURCE_ENTRIES,
  ["green", "Tempo"],
  ["gray", "S.H.I.E.L.D."],
] as const satisfies ReadonlyArray<readonly [TokenColor, string]>;

export function cardInitials(name: string): string {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
}
