"use client";

import { GameSetup } from "./game-setup";
import { GameBoard } from "./game-board";
import { useLocalGame } from "./use-local-game";

export function LocalGameApp() {
  const controller = useLocalGame();
  if (!controller.hasGame || !controller.view) return <GameSetup onStart={controller.startGame} />;
  return (
    <GameBoard
      view={controller.view}
      events={controller.events}
      error={controller.error}
      botThinking={controller.botThinking}
      onAction={controller.submitHumanAction}
      onRestart={controller.restartGame}
      onLeave={controller.leaveGame}
    />
  );
}
