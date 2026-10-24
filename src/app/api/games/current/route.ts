import { NextResponse } from "next/server";
import { getVisitorSession } from "@/server/auth/visitor-session";
import { gameService } from "@/server/games/service";
import { gameErrorResponse } from "@/server/http/game-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const visitor = await getVisitorSession();
    return NextResponse.json({ session: await gameService.current(visitor.ownerSessionId) });
  } catch (error) { return gameErrorResponse(error); }
}
