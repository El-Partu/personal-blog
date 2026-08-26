import { resolve } from "node:path";
import type { Database } from "./types.js";
import { createMemoryDatabase } from "./memory.js";
import { createMongooseDatabase } from "./mongoose.js";
import { env } from "../config/env.js";

let database: Database | null = null;

/**
 * Connect to MongoDB when `MONGODB_URI` is configured; otherwise fall back to
 * the in-process store so `npm run dev` works with zero setup.
 */
export async function connectDatabase(): Promise<Database> {
  if (database) return database;

  if (env.mongodbUri) {
    try {
      database = await createMongooseDatabase(env.mongodbUri);
      console.log("[db] connected to MongoDB");
      return database;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (env.nodeEnv === "production") throw error;
      console.warn(
        `[db] MongoDB connection failed (${message}). Falling back to the in-memory store.`
      );
    }
  } else {
    console.warn(
      "[db] MONGODB_URI is not set — using the in-memory store. Set MONGODB_URI for real persistence."
    );
  }

  database = createMemoryDatabase(resolve(process.cwd(), ".data/dev-db.json"));
  return database;
}

export function getDatabase(): Database {
  if (!database) {
    throw new Error("Database not initialised — call connectDatabase() first.");
  }
  return database;
}

/** Test helper: inject a driver directly. */
export function setDatabase(next: Database | null): void {
  database = next;
}

export type { Database } from "./types.js";
