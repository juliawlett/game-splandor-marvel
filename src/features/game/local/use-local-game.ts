"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameEvent, GameView } from "@/game/core";
import type { GameApiResponse, GameEnvelope } from "@/server/games/contracts";
import type { LocalActionInput, LocalGameConfig } from "./local-game";

export interface UiEvent { id: string; event: GameEvent }
export type LocalGameStatus = "RESTORING" | "FOUND" | "EMPTY" | "CREATING" | "READY" | "SENDING" | "ADVANCING" | "ERROR";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = response.status === 204 ? null : await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(body?.error?.message ?? "Não foi possível comunicar com o servidor.");
  return body as T;
}

export function useLocalGame(botDelayMs = 650) {
  const [view, setView] = useState<GameView | null>(null);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [status, setStatus] = useState<LocalGameStatus>("RESTORING");
  const [error, setError] = useState<string | null>(null);
  const botRequestKey = useRef<string | null>(null);

  const accept = useCallback((session: GameEnvelope) => {
    setView(session.game);
    setEvents(session.events);
    setError(null);
  }, []);

  const restore = useCallback(async () => {
    setStatus("RESTORING");
    setError(null);
    try {
      const result = await api<GameApiResponse>("/api/games/current", { cache: "no-store" });
      if (result.session) {
        accept(result.session);
        setStatus("FOUND");
      } else {
        setView(null);
        setEvents([]);
        setStatus("EMPTY");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao restaurar a partida.");
      setStatus("ERROR");
    }
  }, [accept]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void restore(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [restore]);

  const startGame = useCallback(async (config: LocalGameConfig) => {
    setStatus("CREATING");
    setError(null);
    try {
      const result = await api<GameApiResponse>("/api/games", { method: "POST", body: JSON.stringify(config) });
      if (!result.session) throw new Error("O servidor não retornou a partida criada.");
      accept(result.session);
      setStatus("READY");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar a partida.");
      setStatus("ERROR");
    }
  }, [accept]);

  const submitHumanAction = useCallback(async (input: LocalActionInput) => {
    if (!view || status !== "READY") return;
    setStatus("SENDING");
    setError(null);
    try {
      const result = await api<GameApiResponse>(`/api/games/${view.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ actionId: crypto.randomUUID(), expectedRevision: view.revision, action: input }),
      });
      if (!result.session) throw new Error("Resposta de ação incompleta.");
      accept(result.session);
      setStatus("READY");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao executar a ação.");
      setStatus("READY");
    }
  }, [accept, status, view]);

  useEffect(() => {
    if (!view || status !== "READY" || view.phase === "FINISHED") return;
    const active = view.players.find((player) => player.id === view.activePlayerId);
    if (active?.type !== "BOT") return;
    const key = `${view.id}-${view.revision}`;
    if (botRequestKey.current === key) return;
    const timeout = window.setTimeout(async () => {
      botRequestKey.current = key;
      setStatus("ADVANCING");
      try {
        const result = await api<GameApiResponse>(`/api/games/${view.id}/advance`, {
          method: "POST", body: JSON.stringify({ expectedRevision: view.revision }),
        });
        if (!result.session) throw new Error("Resposta automática incompleta.");
        accept(result.session);
        setStatus("READY");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao processar os robôs.");
        setStatus("READY");
      }
    }, botDelayMs);
    return () => window.clearTimeout(timeout);
  }, [accept, botDelayMs, status, view]);

  const restartGame = useCallback(async () => {
    if (!view || status !== "READY") return;
    const human = view.players.find((player) => player.id === "human");
    const config: LocalGameConfig = {
      humanName: human?.name ?? "Comandante",
      botCount: view.players.filter((player) => player.type === "BOT").length as 1 | 2 | 3,
    };
    setStatus("CREATING");
    try {
      const result = await api<GameApiResponse>(`/api/games/${view.id}/restart`, { method: "POST", body: JSON.stringify({ expectedRevision: view.revision, config }) });
      if (!result.session) throw new Error("Resposta de reinício incompleta.");
      accept(result.session);
      botRequestKey.current = null;
      setStatus("READY");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao reiniciar.");
      setStatus("READY");
    }
  }, [accept, status, view]);

  const leaveGame = useCallback(async () => {
    if (!view) return;
    try {
      await api<null>(`/api/games/${view.id}`, { method: "DELETE", body: JSON.stringify({ expectedRevision: view.revision }) });
      setView(null); setEvents([]); setError(null); setStatus("EMPTY");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao abandonar a partida.");
    }
  }, [view]);

  return {
    view, events, status, error,
    hasGame: status === "READY" || status === "SENDING" || status === "ADVANCING",
    botThinking: status === "ADVANCING",
    continueGame: () => setStatus("READY"), newGame: () => setStatus("EMPTY"), retryRestore: restore,
    startGame, submitHumanAction, restartGame, leaveGame,
  };
}
