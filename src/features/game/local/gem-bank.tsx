"use client";

import { useMemo, useState } from "react";
import { REGULAR_COLORS, type GameView, type RegularColor } from "@/game/core";
import type { LocalActionInput } from "./local-game";
import { TOKEN_RESOURCE_ENTRIES } from "./game-ui";
import { ResourceIcon } from "./resource-icon";

export function GemBank({ view, disabled, onAction }: {
  view: GameView;
  disabled: boolean;
  onAction: (action: LocalActionInput) => void;
}) {
  const [mode, setMode] = useState<"different" | "same">("different");
  const [colors, setColors] = useState<RegularColor[]>([]);
  const human = view.players.find((player) => player.id === "human")!;
  const available = useMemo(() => REGULAR_COLORS.filter((color) => view.bank[color] > 0), [view.bank]);
  const required = Math.min(3, available.length);
  const valid = mode === "different"
    ? required > 0 && colors.length === required && colors.every((color) => view.bank[color] > 0)
    : colors.length === 1 && view.bank[colors[0]!] >= 4;

  function select(color: RegularColor) {
    if (disabled) return;
    if (mode === "same") {
      setColors(colors[0] === color ? [] : [color]);
      return;
    }
    setColors((current) => current.includes(color)
      ? current.filter((item) => item !== color)
      : current.length < required ? [...current, color] : current);
  }

  function confirm() {
    if (!valid) return;
    if (mode === "different") onAction({ type: "TAKE_DIFFERENT", colors });
    else onAction({ type: "TAKE_SAME", color: colors[0]! });
  }

  return (
    <section className="bank-panel" aria-labelledby="bank-title">
      <div className="panel-title"><h2 id="bank-title">Banco de joias</h2><span>{colors.length} selecionada(s)</span></div>
      <div className="bank-gems">
        {TOKEN_RESOURCE_ENTRIES.map(([color, label]) => {
          const regular = REGULAR_COLORS.includes(color as RegularColor);
          const selected = regular && colors.includes(color as RegularColor);
          return (
            <button
              className={`bank-gem${selected ? " is-selected" : ""}`}
              disabled={!regular || disabled || view.bank[color] === 0}
              onClick={() => regular && select(color as RegularColor)}
              type="button"
              key={color}
              aria-pressed={selected}
            >
              <ResourceIcon color={color} size="md" />
              <span>{label}<strong>{view.bank[color]}</strong><small>Você: {human.tokens[color]}</small></span>
            </button>
          );
        })}
      </div>
      <div className="collect-mode" role="group" aria-label="Tipo de coleta">
        <button className={mode === "different" ? "is-selected" : ""} onClick={() => { setMode("different"); setColors([]); }} type="button">Cores diferentes</button>
        <button className={mode === "same" ? "is-selected" : ""} onClick={() => { setMode("same"); setColors([]); }} type="button">Duas iguais</button>
      </div>
      <p className="bank-hint">
        {mode === "different" ? `Escolha exatamente ${required || "nenhuma"} cor(es) disponível(is).` : "O banco precisa ter pelo menos 4 fichas da cor."}
      </p>
      <div className="bank-actions">
        <button className="game-button game-button--primary" disabled={!valid || disabled} onClick={confirm} type="button">Confirmar coleta</button>
        <button className="game-button game-button--ghost" disabled={colors.length === 0} onClick={() => setColors([])} type="button">Cancelar</button>
      </div>
    </section>
  );
}
