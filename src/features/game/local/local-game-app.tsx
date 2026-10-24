"use client";

import { GameSetup } from "./game-setup";
import { GameBoard } from "./game-board";
import { useLocalGame } from "./use-local-game";

export function LocalGameApp() {
  const controller = useLocalGame();
  if (controller.status === "RESTORING") return <GameStateMessage title="Restaurando partida" detail="Consultando o snapshot autoritativo no MySQL..." />;
  if (controller.status === "ERROR") return <GameStateMessage title="Banco indisponível" detail={controller.error ?? "Não foi possível consultar sua partida."} action="Tentar novamente" onAction={controller.retryRestore} />;
  if (controller.status === "FOUND" && controller.view) return (
    <GameStateMessage
      title="Partida encontrada"
      detail={`Turno ${controller.view.turnNumber}, revisão ${controller.view.revision}. Você pode continuar exatamente de onde parou.`}
      action="Continuar partida"
      onAction={controller.continueGame}
      secondaryAction="Iniciar nova partida"
      onSecondaryAction={controller.newGame}
    />
  );
  if (!controller.hasGame || !controller.view) return <GameSetup onStart={controller.startGame} busy={controller.status === "CREATING"} error={controller.error} />;
  return (
    <GameBoard
      view={controller.view}
      events={controller.events}
      error={controller.error}
      botThinking={controller.botThinking}
      busy={controller.status !== "READY"}
      onAction={controller.submitHumanAction}
      onRestart={controller.restartGame}
      onLeave={controller.leaveGame}
    />
  );
}

function GameStateMessage({ title, detail, action, onAction, secondaryAction, onSecondaryAction }: {
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <main className="game-shell setup-shell">
      <section className="setup-copy"><p className="game-kicker">Nexus persistente</p><h1>{title}</h1><p>{detail}</p></section>
      <section className="setup-form">
        {action ? <button className="game-button game-button--primary" onClick={onAction} type="button">{action}</button> : null}
        {secondaryAction ? <button className="game-button game-button--ghost" onClick={onSecondaryAction} type="button">{secondaryAction}</button> : null}
      </section>
    </main>
  );
}
