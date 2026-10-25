import { NextResponse } from "next/server";
import { getVisitorSession } from "@/server/auth/visitor-session";
import { gameService } from "@/server/games/service";
import { gameErrorResponse, readJson } from "@/server/http/game-response";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const [{ id }, visitor] = await Promise.all([context.params, getVisitorSession()]);
    return NextResponse.json({ session: await gameService.get(id, visitor.ownerSessionId) });
  } catch (error) { return gameErrorResponse(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const [{ id }, visitor, body] = await Promise.all([context.params, getVisitorSession(), readJson(request)]);
    await gameService.abandon(id, visitor.ownerSessionId, body);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return gameErrorResponse(error); }
}
