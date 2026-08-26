/**
 * A tiny persistence interface shared by the two storage drivers.
 *
 * Why this exists
 * ---------------
 * Production (and any machine with MongoDB available) uses the **Mongoose**
 * driver in `./mongoose` — those schemas are the canonical data model.
 *
 * The **memory** driver in `./memory` implements the same surface using
 * `mingo`, which evaluates real MongoDB query and aggregation operators in
 * pure JavaScript. It exists so the app, the seed script and the test suite
 * can run in environments where no `mongod` binary is available. It is a
 * development convenience only and is never used when `MONGODB_URI` is set.
 *
 * Controllers depend only on this interface, so neither driver leaks into
 * application code.
 */

export interface FindOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  projection?: Record<string, 0 | 1>;
}

export interface Collection<T> {
  find(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  count(filter: Record<string, unknown>): Promise<number>;
  create(doc: Partial<T>): Promise<T>;
  updateById(id: string, patch: Partial<T>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
  /** Run a MongoDB aggregation pipeline. */
  aggregate<R = Record<string, unknown>>(
    pipeline: Record<string, unknown>[]
  ): Promise<R[]>;
  /** Atomically increment numeric fields. */
  increment(id: string, field: string, by: number): Promise<void>;
}

export interface Database {
  posts: Collection<import("../types/model.db.js").IPost>;
  series: Collection<import("../types/model.db.js").ISeries>;
  tags: Collection<import("../types/model.db.js").ITag>;
  users: Collection<import("../types/model.db.js").IAdminUser>;
  /** Which driver is active — surfaced on the health endpoint. */
  driver: "mongodb" | "memory";
  disconnect(): Promise<void>;
}
