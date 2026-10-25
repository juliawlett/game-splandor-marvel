import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { createLocalGame } from "@/features/game/local/local-game";
import { PrismaGameRepository } from "@/server/games/repository";

const testUrl = process.env.TEST_DATABASE_URL;
const prisma = testUrl ? new PrismaClient({ adapter: new PrismaMariaDb(testUrl) }) : null;
const createdIds: string[] = [];

describe.skipIf(!testUrl)("integração MySQL", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.gameSession.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  it("persiste, recupera e atualiza por revisão em um schema isolado", async () => {
    const repository = new PrismaGameRepository(prisma!);
    const id = `mysql-test-${randomUUID()}`;
    const ownerSessionId = createHash("sha256").update(`mysql-test-owner-${randomUUID()}`).digest("hex");
    createdIds.push(id);
    const state = createLocalGame({ humanName: "Teste", botCount: 1, seed: 7 }, id);
    await repository.create(ownerSessionId, state);
    const recovered = await repository.findAuthorized(id, ownerSessionId);
    expect(recovered?.state).toEqual(state);
    const result = await repository.mutate(id, ownerSessionId, 0, "mysql-action", (snapshot) => {
      const action: GameAction = { type: "TAKE_SAME", color: "yellow", playerId: "human", actionId: "mysql-action" };
      const transition = applyGameAction(snapshot, action);
      if (!transition.ok) throw new Error(transition.error.message);
      return { state: transition.state, events: transition.events, action };
    });
    expect(result.state.revision).toBe(1);
    await expect(repository.mutate(id, ownerSessionId, 0, "stale", () => result)).rejects.toMatchObject({ code: "REVISION_CONFLICT" });
  });
});

import { applyGameAction, type GameAction } from "@/game/core";
