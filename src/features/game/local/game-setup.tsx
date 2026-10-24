"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { LocalGameConfig } from "./local-game";

export function GameSetup({ onStart, busy = false, error = null }: { onStart: (config: LocalGameConfig) => void; busy?: boolean; error?: string | null }) {
  const [name, setName] = useState("Ana");
  const [botCount, setBotCount] = useState<1 | 2 | 3>(1);
  const [seed, setSeed] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSeed = seed.trim() ? Number(seed) : undefined;
    onStart({ humanName: name, botCount, seed: Number.isInteger(parsedSeed) ? parsedSeed : undefined });
  }

  return (
    <main className="game-shell setup-shell">
      <section className="setup-copy">
        <p className="game-kicker">Partida local</p>
        <h1>Monte sua equipe de rivais.</h1>
        <p>Você joga no primeiro assento. Orion, Vega e Atlas usam o mesmo motor de regras e nunca veem informações secretas.</p>
        <div className="setup-constellation" aria-hidden="true"><span /><span /><span /><span /></div>
      </section>
      <form className="setup-form" onSubmit={handleSubmit}>
        <div className="setup-avatar" aria-hidden="true">{(name.trim()[0] ?? "C").toUpperCase()}</div>
        <label>
          <span>Seu nome</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} required />
        </label>
        <fieldset>
          <legend>Quantidade de robôs</legend>
          <div className="bot-options">
            {([1, 2, 3] as const).map((count) => (
              <button
                className={botCount === count ? "is-selected" : ""}
                onClick={() => setBotCount(count)}
                type="button"
                key={count}
                aria-pressed={botCount === count}
              >
                <strong>{count}</strong>
                <span>{count === 1 ? "robô" : "robôs"}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          <span>Seed de desenvolvimento <small>opcional</small></span>
          <input value={seed} onChange={(event) => setSeed(event.target.value)} inputMode="numeric" placeholder="Ex.: 42" />
        </label>
        <div className="setup-actions">
          <button className="game-button game-button--primary" disabled={busy} type="submit">{busy ? "Criando..." : "Iniciar partida"}</button>
          <Link className="game-button game-button--ghost" href="/">Voltar</Link>
        </div>
        {error ? <p className="game-error" role="alert">{error}</p> : null}
        <p className="setup-note">Dificuldade básica. A partida é persistida no MySQL e vinculada a esta sessão anônima.</p>
      </form>
    </main>
  );
}
