import type { GameEvent, GameView } from "@/game/core";

export interface PersistedUiEvent { id: string; event: GameEvent }
export interface GameEnvelope { game: GameView; events: PersistedUiEvent[] }
export interface GameApiResponse { session: GameEnvelope | null }
export interface GameApiError { error: { code: string; message: string; currentRevision?: number } }
