import { NextResponse } from "next/server";
import { getVisitorSession } from "@/server/auth/visitor-session";
import { gameService } from "@/server/games/service";
import { gameErrorResponse, readJson } from "@/server/http/game-response";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, visitor, body] = await Promise.all([params, getVisitorSession(), readJson(request)]);
    return NextResponse.json({ session: await gameService.advance(id, visitor.ownerSessionId, body) });
  } catch (error) { return gameErrorResponse(error); }
}
