import { initializeGame, type GameAction, type GameState, type ParticipantInput } from "@/game/core";
import { cardCatalog } from "@/game/data/catalog";

export interface LocalGameConfig {
  humanName: string;
  botCount: 1 | 2 | 3;
  seed?: number;
}

export type LocalActionInput = GameAction extends infer Action
  ? Action extends GameAction
    ? Omit<Action, "actionId" | "playerId">
    : never
  : never;

const BOT_NAMES = ["Orion", "Vega", "Atlas"] as const;

export function participantsForLocalGame(config: LocalGameConfig): ParticipantInput[] {
  const humanName = config.humanName.trim() || "Comandante";
  return [
    { id: "human", name: humanName, type: "HUMAN" },
    ...Array.from({ length: config.botCount }, (_, index): ParticipantInput => ({
      id: `bot-${index + 1}`,
      name: BOT_NAMES[index]!,
      type: "BOT",
    })),
  ];
}

export function createLocalGame(config: LocalGameConfig): GameState {
  return initializeGame(participantsForLocalGame(config), cardCatalog, {
    id: `local-${config.seed ?? Date.now()}`,
    seed: config.seed,
  });
}
