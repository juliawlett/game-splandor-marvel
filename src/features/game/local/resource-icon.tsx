import Image from "next/image";
import type { TokenColor } from "@/game/core";
import { RESOURCE_ASSETS, RESOURCE_LABELS } from "./game-ui";

export function ResourceIcon({ color, size = "sm", label = true }: { color: TokenColor; size?: "xs" | "sm" | "md"; label?: boolean }) {
  return <Image className={`resource-icon resource-icon--${size}`} src={RESOURCE_ASSETS[color]} width={48} height={48} alt={label ? RESOURCE_LABELS[color] : ""} />;
}
