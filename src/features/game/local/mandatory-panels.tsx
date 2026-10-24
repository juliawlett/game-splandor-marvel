"use client";

import { useState } from "react";
import { REGULAR_COLORS, TOKEN_COLORS, emptyResources, totalTokens, type GameView, type ResourceMap } from "@/game/core";
import type { LocalActionInput } from "./local-game";
import { RESOURCE_LABELS } from "./game-ui";

export function TokenReturnPanel({ view, onAction }: { view: GameView; onAction: (action: LocalActionInput) => void }) {
  const player = view.players.find((item) => item.id === "human")!;
  const required = totalTokens(player.tokens) - 10;
  const [tokens, setTokens] = useState<ResourceMap>(() => emptyResources());
  const selected = totalTokens(tokens);

  function change(color: keyof ResourceMap, delta: number) {
    if (color === "green") return;
    setTokens((current) => ({ ...current, [color]: Math.max(0, Math.min(player.tokens[color], current[color] + delta)) }));
  }

  return (
    <div className="blocking-panel" role="dialog" aria-modal="true" aria-labelledby="return-title">
      <div className="blocking-card">
        <p className="game-kicker">Etapa obrigatória</p>
        <h2 id="return-title">Devolva {required} ficha(s)</h2>
        <p>Você precisa terminar o turno com no máximo dez fichas. A Joia do Tempo não pode ser devolvida.</p>
        <div className="token-return-grid">
          {TOKEN_COLORS.filter((color) => color !== "green").map((color) => (
            <div key={color}>
              <i className={`gem gem--${color}`}>{tokens[color]}</i>
              <span>{RESOURCE_LABELS[color]}<small>disponível: {player.tokens[color]}</small></span>
              <div><button onClick={() => change(color, -1)} type="button" aria-label={`Remover ${RESOURCE_LABELS[color]}`}>-</button><button onClick={() => change(color, 1)} type="button" aria-label={`Adicionar ${RESOURCE_LABELS[color]}`}>+</button></div>
            </div>
          ))}
        </div>
        <button className="game-button game-button--primary" disabled={selected !== required} onClick={() => onAction({ type: "RETURN_EXCESS_TOKENS", tokens })} type="button">
          Devolver {selected}/{required}
        </button>
      </div>
    </div>
  );
}

export function LocationChoicePanel({ view, onAction }: { view: GameView; onAction: (action: LocalActionInput) => void }) {
  const player = view.players.find((item) => item.id === "human")!;
  const eligible = view.locations.filter((location) => !location.claimedBy && REGULAR_COLORS.every((color) =>
    player.bonuses[color] >= location.requiredBonuses[color],
  ));
  return (
    <div className="blocking-panel" role="dialog" aria-modal="true" aria-labelledby="location-title">
      <div className="blocking-card">
        <p className="game-kicker">Conquista disponível</p>
        <h2 id="location-title">Escolha um Local</h2>
        <p>Somente um Local pode ser conquistado neste turno.</p>
        <div className="location-options">
          {eligible.map((location) => <button onClick={() => onAction({ type: "CLAIM_LOCATION", locationId: location.id })} type="button" key={location.id}>{location.name}<strong>+3 PI</strong></button>)}
        </div>
      </div>
    </div>
  );
}
