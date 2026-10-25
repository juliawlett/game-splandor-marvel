"use client";

import { useEffect, useRef, useState } from "react";
import {
  REGULAR_COLORS,
  TOKEN_COLORS,
  describeCardAffordability,
  emptyResources,
  validatePayment,
  type CharacterCard,
  type GameView,
  type ResourceMap,
} from "@/game/core";
import type { LocalActionInput } from "./local-game";
import { RESOURCE_LABELS } from "./game-ui";
import { CharacterCard as CharacterCardView } from "./character-card";
import { ResourceIcon } from "./resource-icon";

export type CardSource = "VISIBLE" | "RESERVED";

interface CardDetailProps {
  card: CharacterCard;
  source: CardSource;
  view: GameView;
  canAct: boolean;
  onClose: () => void;
  error: string | null;
  onAction: (action: LocalActionInput) => Promise<boolean>;
}

export function CardDetail({ card, source, view, canAct, error, onClose, onAction }: CardDetailProps) {
  const player = view.players.find((item) => item.id === "human")!;
  const affordability = describeCardAffordability(card, player.bonuses, player.tokens);
  const { discountedCost: cost, suggestedPayment: suggestion } = affordability;
  const [payment, setPayment] = useState<ResourceMap>(() => suggestion ?? emptyResources());
  const paymentError = validatePayment(cost, payment, player.tokens);
  const closeRef = useRef<HTMLButtonElement>(null);
  const missing = REGULAR_COLORS.map((color) => ({ color, amount: affordability.shortfall[color] })).filter(({ amount }) => amount > 0);
  const grayCover = affordability.grayAppliedToShortfall;
  const actualMissing = affordability.missingAfterGray;
  const free = REGULAR_COLORS.every((color) => cost[color] === 0);
  const reserveAllowed = source === "VISIBLE" && player.reservedCards.length < 3 && canAct;

  function changePayment(color: keyof ResourceMap, delta: number) {
    if (color === "green") return;
    setPayment((current) => ({
      ...current,
      [color]: Math.max(0, Math.min(player.tokens[color], current[color] + delta)),
    }));
  }

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [onClose]);

  async function recruit() {
    if (paymentError || !canAct) return;
    const success = await onAction(source === "VISIBLE"
      ? { type: "RECRUIT_VISIBLE", cardId: card.id, payment }
      : { type: "RECRUIT_RESERVED", cardId: card.id, payment });
    if (success) onClose();
  }

  return (
    <div className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="card-detail-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card-dialog__content">
        <button ref={closeRef} className="dialog-close" onClick={onClose} type="button" aria-label="Fechar detalhes">Fechar</button>
        <div className="card-dialog__preview"><CharacterCardView card={card} /></div>
        <section>
          <p className="game-kicker">Detalhes do personagem</p>
          <h2 id="card-detail-title">{card.name}</h2>
          <div className="cost-comparison">
            {REGULAR_COLORS.map((color) => (
              <div key={color}>
                <ResourceIcon color={color} size="sm" />
                <span>{RESOURCE_LABELS[color]}<small>original {card.cost[color]} | bônus −{player.bonuses[color]} | final {cost[color]}</small></span>
              </div>
            ))}
          </div>
          <section className={`affordability ${suggestion ? "is-affordable" : "is-unaffordable"}`} aria-live="polite">
            <strong>{suggestion ? "Você pode recrutar este personagem agora." : "Faltam recursos para recrutar."}</strong>
            {suggestion ? <span>O pagamento sugerido utiliza seus bônus e curingas disponíveis.</span> : <span>{grayCover ? `${grayCover} falta(s) será(ão) coberta(s) por S.H.I.E.L.D. · ` : ""}{actualMissing} ficha(s) ainda necessária(s).</span>}
            {!suggestion ? <div>{missing.map(({ color, amount }) => <span className="missing-resource" key={color}><ResourceIcon color={color} size="xs" />Falta {amount} {RESOURCE_LABELS[color]}</span>)}</div> : null}
          </section>
          {free ? <p className="success-copy">Recrutamento gratuito graças aos seus bônus.</p> : null}
          <div className="payment-editor">
            <div className="panel-title"><h3>Pagamento</h3><button onClick={() => setPayment(suggestion ?? emptyResources())} disabled={!suggestion} type="button">Usar sugestão</button></div>
            {TOKEN_COLORS.filter((color) => color !== "green").map((color) => (
              <div className="payment-row" key={color}>
                <ResourceIcon color={color} size="xs" />
                <span>{RESOURCE_LABELS[color]} <small>você tem {player.tokens[color]}</small></span>
                <button onClick={() => changePayment(color, -1)} type="button" aria-label={`Diminuir ${RESOURCE_LABELS[color]}`}>-</button>
                <strong>{payment[color]}</strong>
                <button onClick={() => changePayment(color, 1)} type="button" aria-label={`Aumentar ${RESOURCE_LABELS[color]}`}>+</button>
              </div>
            ))}
          </div>
          <p className={paymentError ? "error-copy" : "success-copy"}>{paymentError ?? "Pagamento válido."}</p>
          {error ? <p className="error-copy" role="alert">{error}</p> : null}
          <div className="dialog-actions">
            <button className="game-button game-button--primary" disabled={!canAct || Boolean(paymentError)} onClick={recruit} type="button">Recrutar</button>
            {source === "VISIBLE" ? (
              <button className="game-button game-button--ghost" disabled={!reserveAllowed} onClick={async () => { if (await onAction({ type: "RESERVE_VISIBLE", cardId: card.id })) onClose(); }} type="button">Reservar</button>
            ) : null}
          </div>
          {!canAct ? <p className="disabled-explanation">Aguarde o seu turno para agir.</p> : null}
          {!suggestion && canAct ? <p className="disabled-explanation">Recursos insuficientes. Colete as joias destacadas no custo restante.</p> : null}
          {source === "VISIBLE" && player.reservedCards.length >= 3 ? <p className="disabled-explanation">Você já possui três cartas reservadas.</p> : null}
        </section>
      </div>
    </div>
  );
}
