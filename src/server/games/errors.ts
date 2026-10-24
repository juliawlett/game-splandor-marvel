export type GameServiceErrorCode =
  | "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "REVISION_CONFLICT"
  | "DUPLICATE_ACTION" | "INVALID_ACTION" | "INVALID_SNAPSHOT" | "DATABASE_UNAVAILABLE";

export class GameServiceError extends Error {
  constructor(public readonly code: GameServiceErrorCode, message: string, public readonly status: number) {
    super(message);
    this.name = "GameServiceError";
  }
}

export function unavailable(error: unknown): never {
  if (error instanceof GameServiceError) throw error;
  console.error("Falha de persistência do Nexus Infinito", error);
  throw new GameServiceError("DATABASE_UNAVAILABLE", "Não foi possível acessar o MySQL. Verifique o serviço e a DATABASE_URL.", 503);
}
