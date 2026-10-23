"use client";

import { useMemo, useState } from "react";
import type { CardLevel, CharacterCard, RegularColor } from "@/game/core";

const COLOR_LABELS: Record<RegularColor, string> = { yellow: "Mente", blue: "Espaço", orange: "Alma", purple: "Poder", red: "Realidade" };
const colorEntries = Object.entries(COLOR_LABELS) as Array<[RegularColor, string]>;

function CharacterCardView({ card }: { card: CharacterCard }) {
  const initials = card.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
  return (
    <article className={`character-card level-${card.level}`}>
      <div className="card-portrait" aria-label="Imagem ainda não disponível">
        <span>{initials}</span>
        <small>arte pendente</small>
      </div>
      <div className="card-body">
        <div className="card-title-row"><h2>{card.name}</h2><span>N{card.level}</span></div>
        <div className="card-stats">
          <span><strong>{card.infinityPoints}</strong> pontos</span>
          <span><strong>{card.avengersSymbols}</strong> Vingadores</span>
          {card.grantsTimeStone && <span className="time-badge">Joia do Tempo</span>}
        </div>
        <div className="cost-row" aria-label="Custo da carta">
          {colorEntries.filter(([color]) => card.cost[color] > 0).map(([color, label]) => (
            <span className={`resource resource-${color}`} title={label} key={color}>{card.cost[color]}</span>
          ))}
        </div>
        <p className="bonus-line">Bônus permanente <span className={`bonus-dot resource-${card.bonusColor}`} /> {COLOR_LABELS[card.bonusColor]}</p>
      </div>
    </article>
  );
}

export function CatalogBrowser({ cards }: { cards: CharacterCard[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | CardLevel>("all");
  const filtered = useMemo(() => {
    const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return cards.filter((card) => (level === "all" || card.level === level) && card.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalized));
  }, [cards, level, query]);

  return (
    <section>
      <div className="catalog-controls">
        <label className="search-field">
          <span className="sr-only">Pesquisar personagem</span>
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar personagem" type="search" />
        </label>
        <div className="level-filter" role="group" aria-label="Filtrar por nível">
          {(["all", 1, 2, 3] as const).map((value) => (
            <button className={level === value ? "selected" : ""} onClick={() => setLevel(value)} type="button" key={value}>
              {value === "all" ? "Todos" : `Nível ${value}`}
            </button>
          ))}
        </div>
        <p aria-live="polite"><strong>{filtered.length}</strong> de {cards.length} cartas</p>
      </div>
      {filtered.length > 0 ? <div className="card-grid">{filtered.map((card) => <CharacterCardView card={card} key={card.id} />)}</div> : (
        <div className="empty-result"><h2>Nenhum personagem encontrado</h2><p>Revise o nome ou selecione outro nível.</p></div>
      )}
    </section>
  );
}
