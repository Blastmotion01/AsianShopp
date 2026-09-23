import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Load .env so integration tests can reach DATABASE_URL (they skip when it's absent).
    env: loadEnv(mode, process.cwd(), ""),
    // Integration tests share one database: run files sequentially.
    fileParallelism: false,
    testTimeout: 20_000,
  },
}));
