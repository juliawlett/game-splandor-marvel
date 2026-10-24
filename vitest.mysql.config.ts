import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/server/tests/mysql.integration.test.ts"], fileParallelism: false },
  resolve: { alias: { "@": resolve(import.meta.dirname, "src"), "server-only": resolve(import.meta.dirname, "src/test/server-only.ts") } },
});
