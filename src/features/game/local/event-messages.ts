import type { GameEvent, GameView } from "@/game/core";

const playerName = (view: GameView, id?: string): string =>
  view.players.find((player) => player.id === id)?.name ?? "Um participante";

const cardName = (view: GameView, id: unknown): string =>
  view.catalog.find((card) => card.id === id)?.name ?? "um personagem";

export function formatGameEvent(event: GameEvent, view: GameView): string {
  const actor = playerName(view, event.actorId);
  switch (event.type) {
    case "TOKENS_TAKEN":
      return `${actor} coletou joias.`;
    case "CARD_RESERVED":
      return event.payload?.hidden
        ? `${actor} reservou uma carta do topo.`
        : `${actor} reservou ${cardName(view, event.payload?.cardId)}.`;
    case "CARD_RECRUITED":
      return `${actor} recrutou ${cardName(view, event.payload?.cardId)}.`;
    case "TOKENS_RETURNED":
      return `${actor} devolveu o excedente de joias.`;
    case "TIME_STONE_GRANTED":
      return `${actor} recebeu a Joia do Tempo.`;
    case "AVENGERS_TRANSFERRED":
      return `${actor} assumiu o cartão Vingadores.`;
    case "LOCATION_CLAIMED":
      return `${actor} conquistou um Local.`;
    case "FINAL_ROUND_TRIGGERED":
      return "A rodada final começou.";
    case "FINAL_ROUND_REVOKED":
      return "A rodada final foi revogada.";
    case "MATCH_FINISHED":
      return "A partida terminou.";
    case "TURN_STARTED":
      return `Turno de ${actor}.`;
    case "CARD_REVEALED":
      return `Uma nova carta de nível ${String(event.payload?.level ?? "")} foi revelada.`;
    default:
      return "O estado da partida foi atualizado.";
  }
}
