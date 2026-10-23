import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/game/tests/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
});
