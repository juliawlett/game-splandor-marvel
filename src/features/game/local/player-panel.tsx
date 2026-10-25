import type { GameView, PlayerView } from "@/game/core";
import { REGULAR_RESOURCE_ENTRIES, TOKEN_RESOURCE_ENTRIES } from "./game-ui";
import { ResourceIcon } from "./resource-icon";

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
        <b className="score-readout">{player.score}<small>/16 PI</small></b>
      </header>
      {!compact ? <div className="bonus-strip" aria-label="Bônus permanentes">
        <span className="hud-label">Bônus</span>
        {REGULAR_RESOURCE_ENTRIES.map(([color, label]) => <span className={`bonus-counter${player.bonuses[color] ? " is-owned" : ""}`} key={color} title={`${label}: bônus permanente ${player.bonuses[color]}`}><ResourceIcon color={color} size="xs" />{player.bonuses[color]}</span>)}
      </div> : null}
      <div className="player-resources" aria-label={`Recursos de ${player.name}`}>
        {TOKEN_RESOURCE_ENTRIES.map(([color, label]) => (
          <span title={`${label}: ${player.tokens[color]} fichas`} key={color}><ResourceIcon color={color} size="xs" />{player.tokens[color]}</span>
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
              <span className={player.bonuses[color] > 0 ? "is-owned" : ""} title={`${label}: ${player.bonuses[color]}`} key={color}><ResourceIcon color={color} size="xs" label={false} /></span>
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
