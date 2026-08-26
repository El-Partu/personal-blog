import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, getDatabase } from "./db/index.js";

async function start() {
  await connectDatabase();

  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`[api] listening on http://0.0.0.0:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[api] ${signal} received, shutting down.`);
    server.close(async () => {
      await getDatabase().disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("[api] failed to start:", error);
  process.exit(1);
});
