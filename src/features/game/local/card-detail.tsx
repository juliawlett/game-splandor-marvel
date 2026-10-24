"use client";

import { useState } from "react";
import {
  REGULAR_COLORS,
  TOKEN_COLORS,
  discountedCost,
  emptyResources,
  suggestCardPayment,
  validatePayment,
  type CharacterCard,
  type GameView,
  type ResourceMap,
} from "@/game/core";
import type { LocalActionInput } from "./local-game";
import { RESOURCE_LABELS } from "./game-ui";
import { CharacterCard as CharacterCardView } from "./character-card";

export type CardSource = "VISIBLE" | "RESERVED";

interface CardDetailProps {
  card: CharacterCard;
  source: CardSource;
  view: GameView;
  canAct: boolean;
  onClose: () => void;
  onAction: (action: LocalActionInput) => boolean | void;
}

export function CardDetail({ card, source, view, canAct, onClose, onAction }: CardDetailProps) {
  const player = view.players.find((item) => item.id === "human")!;
  const cost = discountedCost(card, player.bonuses);
  const suggestion = suggestCardPayment(card, player.bonuses, player.tokens);
  const [payment, setPayment] = useState<ResourceMap>(() => suggestion ?? emptyResources());
  const paymentError = validatePayment(cost, payment, player.tokens);
  const free = REGULAR_COLORS.every((color) => cost[color] === 0);
  const reserveAllowed = source === "VISIBLE" && player.reservedCards.length < 3 && canAct;

  function changePayment(color: keyof ResourceMap, delta: number) {
    if (color === "green") return;
    setPayment((current) => ({
      ...current,
      [color]: Math.max(0, Math.min(player.tokens[color], current[color] + delta)),
    }));
  }

  function recruit() {
    if (paymentError || !canAct) return;
    onAction(source === "VISIBLE"
      ? { type: "RECRUIT_VISIBLE", cardId: card.id, payment }
      : { type: "RECRUIT_RESERVED", cardId: card.id, payment });
    onClose();
  }

  return (
    <div className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="card-detail-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card-dialog__content">
        <button className="dialog-close" onClick={onClose} type="button" aria-label="Fechar detalhes">Fechar</button>
        <div className="card-dialog__preview"><CharacterCardView card={card} /></div>
        <section>
          <p className="game-kicker">Detalhes do personagem</p>
          <h2 id="card-detail-title">{card.name}</h2>
          <div className="cost-comparison">
            {REGULAR_COLORS.map((color) => (
              <div key={color}>
                <i className={`gem gem--${color}`}>{card.cost[color]}</i>
                <span>{RESOURCE_LABELS[color]}<small>bônus {player.bonuses[color]} | restante {cost[color]}</small></span>
              </div>
            ))}
          </div>
          {free ? <p className="success-copy">Recrutamento gratuito graças aos seus bônus.</p> : null}
          <div className="payment-editor">
            <div className="panel-title"><h3>Pagamento</h3><button onClick={() => setPayment(suggestion ?? emptyResources())} disabled={!suggestion} type="button">Usar sugestão</button></div>
            {TOKEN_COLORS.filter((color) => color !== "green").map((color) => (
              <div className="payment-row" key={color}>
                <i className={`gem-dot gem-dot--${color}`} />
                <span>{RESOURCE_LABELS[color]} <small>você tem {player.tokens[color]}</small></span>
                <button onClick={() => changePayment(color, -1)} type="button" aria-label={`Diminuir ${RESOURCE_LABELS[color]}`}>-</button>
                <strong>{payment[color]}</strong>
                <button onClick={() => changePayment(color, 1)} type="button" aria-label={`Aumentar ${RESOURCE_LABELS[color]}`}>+</button>
              </div>
            ))}
          </div>
          <p className={paymentError ? "error-copy" : "success-copy"}>{paymentError ?? "Pagamento válido."}</p>
          <div className="dialog-actions">
            <button className="game-button game-button--primary" disabled={!canAct || Boolean(paymentError)} onClick={recruit} type="button">Recrutar</button>
            {source === "VISIBLE" ? (
              <button className="game-button game-button--ghost" disabled={!reserveAllowed} onClick={() => { onAction({ type: "RESERVE_VISIBLE", cardId: card.id }); onClose(); }} type="button">Reservar</button>
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
