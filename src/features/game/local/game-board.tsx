"use client";

import { useState } from "react";
import Image from "next/image";
import type { CharacterCard, GameView } from "@/game/core";
import type { UiEvent } from "./use-local-game";
import type { LocalActionInput } from "./local-game";
import { formatGameEvent } from "./event-messages";
import { CharacterCard as CharacterCardView } from "./character-card";
import { PlayerPanel } from "./player-panel";
import { GemBank } from "./gem-bank";
import { CardDetail, type CardSource } from "./card-detail";
import { LocationChoicePanel, TokenReturnPanel } from "./mandatory-panels";
import { NEXUS_LOGO } from "./game-ui";

interface Selection { card: CharacterCard; source: CardSource }

interface GameBoardProps {
  view: GameView;
  events: UiEvent[];
  error: string | null;
  botThinking: boolean;
  busy: boolean;
  onAction: (action: LocalActionInput) => Promise<boolean>;
  onRestart: () => void;
  onLeave: () => void;
}

export function GameBoard({ view, events, error, botThinking, busy, onAction, onRestart, onLeave }: GameBoardProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const human = view.players.find((player) => player.id === "human")!;
  const bots = view.players.filter((player) => player.type === "BOT");
  const active = view.players.find((player) => player.id === view.activePlayerId);
  const canAct = !busy && view.activePlayerId === "human" && (view.phase === "IN_PROGRESS" || view.phase === "FINAL_ROUND");
  const reservedCards = human.reservedCards.flatMap((reserved) => {
    const card = reserved.cardId ? view.catalog.find((item) => item.id === reserved.cardId) : undefined;
    return card ? [card] : [];
  });
  const purchasedCards = human.purchasedCardIds.flatMap((id) => {
    const card = view.catalog.find((item) => item.id === id);
    return card ? [card] : [];
  });

  function choose(card: CharacterCard, source: CardSource) {
    setSelection({ card, source });
  }

  return (
    <main className="board-page">
      <header className="board-status board-status--redesign">
        <div className="board-brand">
          <Image src={NEXUS_LOGO} width={130} height={54} alt="Emblema Nexus Infinito" priority />
          <div><p className="game-kicker">Nexus Infinito · turno {view.turnNumber}</p><h1>{botThinking ? `${active?.name ?? "Robô"} está calculando...` : active?.id === "human" ? "Sua vez" : `Vez de ${active?.name ?? "-"}`}</h1></div>
        </div>
        <div className="board-status__actions">
          {view.phase === "FINAL_ROUND" ? <span className="final-round-chip">Rodada final</span> : null}
          <button onClick={onLeave} type="button">Nova configuração</button>
        </div>
      </header>

      {error ? <div className="game-error" role="alert">{error}</div> : null}

      <section className="human-hud" aria-label="Seu estado de jogo"><PlayerPanel player={human} view={view} /></section>

      <section className="opponents" aria-label="Adversários">
        {bots.map((bot) => <PlayerPanel player={bot} view={view} compact key={bot.id} />)}
      </section>

      <div className="board-layout">
        <aside className="bank-column"><GemBank key={`bank-${view.revision}`} view={view} disabled={!canAct} onAction={onAction} /></aside>
        <section className="market" aria-label="Mercado de personagens">
          {([3, 2, 1] as const).map((level) => (
            <div className={`market-row market-row--${level}`} key={level}>
              <aside>
                <span>Nível</span><strong>{level}</strong><small>{view.deckSizes[level]} no baralho</small>
                <button
                  disabled={!canAct || human.reservedCards.length >= 3 || view.deckSizes[level] === 0}
                  onClick={() => onAction({ type: "RESERVE_TOP", level })}
                  type="button"
                >Reservar topo</button>
              </aside>
              <div className="market-cards">
                {view.visibleCards[level].map((card) => <CharacterCardView card={card} onSelect={(chosen) => choose(chosen, "VISIBLE")} key={card.id} />)}
                {view.visibleCards[level].length === 0 ? <p className="empty-market">Baralho esgotado</p> : null}
              </div>
            </div>
          ))}
        </section>

        <aside className="board-sidebar">
          <section className="special-panel">
            <div className="panel-title"><h2>Manopla</h2><span>{human.score}/16 PI</span></div>
            <p><strong>Pontos:</strong> {human.score}/16</p><p><strong>Cores:</strong> {Object.values(human.bonuses).filter((value) => value > 0).length}/5</p><p><strong>Tempo:</strong> {human.tokens.green ? "adquirida" : "pendente"}</p>
            <p><strong>Vingadores:</strong> {view.avengersOwnerId ? view.players.find((player) => player.id === view.avengersOwnerId)?.name : "sem portador"}.</p>
            {!view.locations.length ? <small>O catálogo oficial de Locais permanece pendente; a partida padrão não os instancia.</small> : null}
          </section>
          <section className="history-panel" aria-labelledby="history-title">
            <div className="panel-title"><h2 id="history-title">Histórico</h2><span>{events.length}</span></div>
            {events.length ? <ol>{events.slice(-10).reverse().map((entry) => <li key={entry.id}>{formatGameEvent(entry.event, view)}</li>)}</ol> : <p>Nenhuma ação realizada.</p>}
          </section>
        </aside>
      </div>

      <section className={`human-area collection-drawer${collectionOpen ? " is-open" : ""}`} aria-label="Sua coleção">
        <button className="collection-toggle" type="button" onClick={() => setCollectionOpen((open) => !open)} aria-expanded={collectionOpen}>Reservadas {reservedCards.length}/3 · Recrutadas {purchasedCards.length} · {collectionOpen ? "Ocultar coleção" : "Ver coleção"}</button>
        {collectionOpen ? <div className="collection-panel">
          <div className="collection-block">
            <div className="panel-title"><h2>Reservas</h2><span>{reservedCards.length}/3</span></div>
            <div className="collection-scroll">
              {reservedCards.map((card) => <CharacterCardView card={card} compact onSelect={(chosen) => choose(chosen, "RESERVED")} key={card.id} />)}
              {!reservedCards.length ? <p>Reserve uma carta visível ou do topo de um baralho.</p> : null}
            </div>
          </div>
          <div className="collection-block">
            <div className="panel-title"><h2>Personagens recrutados</h2><span>{purchasedCards.length}</span></div>
            <div className="collection-scroll collection-scroll--purchased">
              {purchasedCards.map((card) => <CharacterCardView card={card} compact key={card.id} />)}
              {!purchasedCards.length ? <p>Sua coleção começa vazia.</p> : null}
            </div>
          </div>
        </div> : null}
      </section>

      {selection ? <CardDetail key={`${selection.card.id}-${view.revision}`} card={selection.card} source={selection.source} view={view} canAct={canAct} error={error} onAction={onAction} onClose={() => setSelection(null)} /> : null}
      {view.phase === "AWAITING_TOKEN_RETURN" && view.activePlayerId === "human" ? <TokenReturnPanel key={`return-${view.revision}`} view={view} onAction={onAction} /> : null}
      {view.phase === "AWAITING_LOCATION_CHOICE" && view.activePlayerId === "human" ? <LocationChoicePanel view={view} onAction={onAction} /> : null}
      {view.phase === "FINISHED" ? <GameResult view={view} onRestart={onRestart} onLeave={onLeave} /> : null}
    </main>
  );
}

function GameResult({ view, onRestart, onLeave }: { view: GameView; onRestart: () => void; onLeave: () => void }) {
  const winners = view.winnerIds.map((id) => view.players.find((player) => player.id === id)?.name).filter(Boolean);
  const ranking = [...view.players].sort((left, right) => right.score - left.score || left.purchasedCardIds.length - right.purchasedCardIds.length);
  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <section className="result-card">
        <p className="game-kicker">Partida concluída</p>
        <h2 id="result-title">{winners.length > 1 ? "Vitória compartilhada" : `${winners[0] ?? "Sem vencedor"} venceu`}</h2>
        <p>{view.completedRounds} rodada(s) completas e {view.turnNumber - 1} turnos processados.</p>
        <div className="ranking-list">
          {ranking.map((player, index) => (
            <article key={player.id}>
              <span>{index + 1}</span><strong>{player.name}</strong><b>{player.score} PI</b>
              <small>{player.purchasedCardIds.length} personagens | {player.avengersSymbols} símbolos | {Object.values(player.bonuses).filter((value) => value > 0).length} cores | {player.claimedLocationIds.length} Locais</small>
            </article>
          ))}
        </div>
        <div className="dialog-actions">
          <button className="game-button game-button--primary" onClick={onRestart} type="button">Jogar novamente</button>
          <button className="game-button game-button--ghost" onClick={onLeave} type="button">Voltar ao menu</button>
        </div>
      </section>
    </div>
  );
}
