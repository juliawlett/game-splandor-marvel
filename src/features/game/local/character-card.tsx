import type { CharacterCard } from "@/game/core";
import { REGULAR_RESOURCE_ENTRIES, RESOURCE_LABELS, cardInitials } from "./game-ui";
import { ResourceIcon } from "./resource-icon";

interface CharacterCardProps {
  card: CharacterCard;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (card: CharacterCard) => void;
}

export function CharacterCard({ card, compact = false, selected = false, onSelect }: CharacterCardProps) {
  const content = (
    <>
      <div className="play-card__art" aria-label="Arte temática provisória">
        <span>{cardInitials(card.name)}</span>
        <small>nível {card.level}</small>
      </div>
      <div className="play-card__body">
        <div className="play-card__heading">
          <strong>{card.name}</strong>
          <span>{card.infinityPoints} PI</span>
        </div>
        <div className="play-card__cost" aria-label="Custo">
          {REGULAR_RESOURCE_ENTRIES.filter(([color]) => card.cost[color] > 0).map(([color, label]) => (
            <span className="card-cost" title={`${label}: ${card.cost[color]}`} key={color}><ResourceIcon color={color} size="xs" />{card.cost[color]}</span>
          ))}
          {REGULAR_RESOURCE_ENTRIES.every(([color]) => card.cost[color] === 0) ? <small>Sem custo</small> : null}
        </div>
        <div className="play-card__footer">
          <span><ResourceIcon color={card.bonusColor} size="xs" />Bônus</span>
          <span>{card.avengersSymbols} Ving.</span>
          {card.grantsTimeStone ? <span className="time-mark">Tempo</span> : null}
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        className={`play-card play-card--level-${card.level}${compact ? " play-card--compact" : ""}${selected ? " is-selected" : ""}`}
        onClick={() => onSelect(card)}
        type="button"
        aria-label={`Ver detalhes de ${card.name}`}
      >
        {content}
      </button>
    );
  }
  return <article className={`play-card play-card--level-${card.level}${compact ? " play-card--compact" : ""}`}>{content}</article>;
}
