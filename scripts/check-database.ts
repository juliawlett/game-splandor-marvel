import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não configurada. Copie .env.example para .env e informe o usuário MySQL da aplicação.");
  process.exitCode = 1;
} else {
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
  try {
    const rows = await prisma.$queryRaw<Array<{ version: string; databaseName: string | null }>>`SELECT VERSION() AS version, DATABASE() AS databaseName`;
    console.log(`MySQL acessível. Versão: ${rows[0]?.version ?? "desconhecida"}; schema: ${rows[0]?.databaseName ?? "não selecionado"}.`);
  } catch (error) {
    console.error("Não foi possível acessar o MySQL. Confirme o serviço, a porta, as credenciais e o schema da DATABASE_URL.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
