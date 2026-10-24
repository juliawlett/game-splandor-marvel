import { NextResponse } from "next/server";
import { GameServiceError } from "@/server/games/errors";

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); }
  catch { throw new GameServiceError("BAD_REQUEST", "O corpo da requisição deve ser JSON válido.", 400); }
}

export function gameErrorResponse(error: unknown): NextResponse {
  if (error instanceof GameServiceError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error("Erro inesperado na API de partidas", error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Falha interna ao processar a partida." } }, { status: 500 });
}
