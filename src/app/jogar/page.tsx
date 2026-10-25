import type { Metadata } from "next";
import { LocalGameApp } from "@/features/game/local/local-game-app";

export const metadata: Metadata = {
  title: "Jogar | Nexus Infinito",
  description: "Partida local contra robôs no Nexus Infinito.",
};

export default function PlayPage() {
  return <LocalGameApp />;
}
