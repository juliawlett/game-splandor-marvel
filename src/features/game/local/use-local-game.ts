"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseBasicBotAction } from "@/game/bots";
import { applyGameAction, getPlayerView, seededRandom, type GameEvent, type GameState } from "@/game/core";
import { createLocalGame, type LocalActionInput, type LocalGameConfig } from "./local-game";

export interface UiEvent {
  id: string;
  event: GameEvent;
}

export function useLocalGame(botDelayMs = 650) {
  const [game, setGame] = useState<GameState | null>(null);
  const [config, setConfig] = useState<LocalGameConfig | null>(null);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const actionSequence = useRef(0);
  const botProcessingKey = useRef<string | null>(null);
  const humanProcessedRevision = useRef<number | null>(null);
  const randomRef = useRef(seededRandom(1));

  const appendEvents = useCallback((newEvents: GameEvent[], revision: number) => {
    setEvents((current) => [
      ...current,
      ...newEvents.map((event, index) => ({ id: `${revision}-${index}-${event.type}`, event })),
    ].slice(-30));
  }, []);

  const startGame = useCallback((nextConfig: LocalGameConfig) => {
    const resolved = { ...nextConfig, seed: nextConfig.seed ?? Date.now() };
    const next = createLocalGame(resolved);
    setGame(next);
    setConfig(resolved);
    setEvents([]);
    setError(null);
    actionSequence.current = 0;
    botProcessingKey.current = null;
    humanProcessedRevision.current = null;
    randomRef.current = seededRandom((resolved.seed ?? 1) ^ 0x85ebca6b);
  }, []);

  const submitHumanAction = useCallback((input: LocalActionInput): boolean => {
    if (!game) return false;
    if (humanProcessedRevision.current === game.revision) return false;
    const action = {
      ...input,
      playerId: "human",
      actionId: `human-${game.revision}-${actionSequence.current++}`,
    };
    const result = applyGameAction(game, action);
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    humanProcessedRevision.current = game.revision;
    setGame(result.state);
    appendEvents(result.events, result.state.revision);
    setError(null);
    return true;
  }, [appendEvents, game]);

  const restartGame = useCallback(() => {
    if (config) startGame({ ...config, seed: (config.seed ?? Date.now()) + 1 });
  }, [config, startGame]);

  const leaveGame = useCallback(() => {
    setGame(null);
    setConfig(null);
    setEvents([]);
    setError(null);
    botProcessingKey.current = null;
    humanProcessedRevision.current = null;
  }, []);

  useEffect(() => {
    if (!game || game.phase === "FINISHED") return;
    const active = game.players[game.activePlayerIndex];
    if (!active || active.type !== "BOT") return;
    const key = `${game.revision}-${active.id}-${game.phase}`;
    if (botProcessingKey.current === key) return;
    const timeout = window.setTimeout(() => {
      botProcessingKey.current = key;
      const decision = chooseBasicBotAction(getPlayerView(game, active.id), active.id, { random: randomRef.current });
      if (!decision.action) {
        setError(`${active.name}: ${decision.reason}`);
        return;
      }
      const result = applyGameAction(game, decision.action);
      if (!result.ok) {
        setError(`${active.name}: ${result.error.message}`);
        return;
      }
      setGame(result.state);
      appendEvents(result.events, result.state.revision);
      setError(null);
    }, botDelayMs);

    return () => window.clearTimeout(timeout);
  }, [appendEvents, botDelayMs, game]);

  const view = useMemo(() => game ? getPlayerView(game, "human") : null, [game]);
  const botThinking = Boolean(game && game.players[game.activePlayerIndex]?.type === "BOT" && game.phase !== "FINISHED");
  return { hasGame: Boolean(game), view, events, error, botThinking, startGame, submitHumanAction, restartGame, leaveGame };
}
