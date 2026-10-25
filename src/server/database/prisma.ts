import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as unknown as { nexusPrisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não foi configurada no servidor.");
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
}

export function getPrismaClient(): PrismaClient {
  globalDatabase.nexusPrisma ??= createPrismaClient();
  return globalDatabase.nexusPrisma;
}
