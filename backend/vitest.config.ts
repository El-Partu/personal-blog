import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Tests share a module-level database singleton, so run them serially.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-not-used-in-production",
    },
  },
});
