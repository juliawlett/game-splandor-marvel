import type { GameView, PlayerView } from "@/game/core";
import { REGULAR_RESOURCE_ENTRIES, TOKEN_RESOURCE_ENTRIES } from "./game-ui";

interface PlayerPanelProps {
  player: PlayerView;
  view: GameView;
  compact?: boolean;
}

export function PlayerPanel({ player, view, compact = false }: PlayerPanelProps) {
  const active = view.activePlayerId === player.id;
  return (
    <article className={`player-panel${active ? " is-active" : ""}${compact ? " player-panel--compact" : ""}`}>
      <header>
        <span className="player-avatar" aria-hidden="true">{player.type === "BOT" ? "R" : player.name.slice(0, 1).toUpperCase()}</span>
        <div><strong>{player.name}</strong><small>{player.type === "BOT" ? "Robô básico" : "Você"}</small></div>
        <b>{player.score} PI</b>
      </header>
      <div className="player-resources" aria-label={`Recursos de ${player.name}`}>
        {TOKEN_RESOURCE_ENTRIES.map(([color, label]) => (
          <span title={label} key={color}><i className={`gem-dot gem-dot--${color}`} />{player.tokens[color]}</span>
        ))}
      </div>
      <div className="player-metrics">
        <span><strong>{player.purchasedCardIds.length}</strong> cartas</span>
        <span><strong>{player.reservedCards.length}</strong> reservas</span>
        <span><strong>{player.avengersSymbols}</strong> Vingadores</span>
        <span><strong>{player.claimedLocationIds.length}</strong> Locais</span>
      </div>
      {!compact ? (
        <div className="gauntlet-progress" aria-label="Progresso da Manopla">
          <div><span>Pontos</span><strong>{Math.min(player.score, 16)}/16</strong></div>
          <div className="bonus-pips" aria-label="Cores de bônus conquistadas">
            {REGULAR_RESOURCE_ENTRIES.map(([color, label]) => (
              <i className={`gem-dot gem-dot--${color}${player.bonuses[color] > 0 ? " is-owned" : ""}`} title={`${label}: ${player.bonuses[color]}`} key={color} />
            ))}
          </div>
          <span className={player.tokens.green > 0 ? "requirement-ok" : ""}>Tempo {player.tokens.green > 0 ? "adquirida" : "pendente"}</span>
        </div>
      ) : null}
      {active ? <span className="active-label">Turno atual</span> : null}
      {view.avengersOwnerId === player.id ? <span className="avengers-label">Cartão Vingadores</span> : null}
    </article>
  );
}
