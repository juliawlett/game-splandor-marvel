import { NextResponse } from "next/server";
import { getVisitorSession } from "@/server/auth/visitor-session";
import { gameService } from "@/server/games/service";
import { gameErrorResponse, readJson } from "@/server/http/game-response";

export async function POST(request: Request) {
  try {
    const visitor = await getVisitorSession();
    const session = await gameService.create(visitor.ownerSessionId, await readJson(request));
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) { return gameErrorResponse(error); }
}
