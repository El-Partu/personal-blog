import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Frontend unit tests. Scoped to pure helper modules (`src/lib`) — the React
 * pages are verified by the production build and by curling rendered HTML,
 * so no DOM environment is needed here.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
