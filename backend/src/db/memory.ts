/**
 * Pure-JavaScript MongoDB-compatible store (development / test fallback).
 *
 * Uses `mingo`, which implements real MongoDB query and aggregation operators
 * in JS, so controller code written against MongoDB semantics ($match, $sort,
 * $unwind, $group, $regex, ...) behaves the same here as against a real server.
 *
 * Used ONLY when `MONGODB_URI` is unset. Data lives in memory and is optionally
 * mirrored to a JSON file so the seeded content survives a dev-server restart.
 */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Aggregator, Query } from "mingo";
import type { Collection, Database, FindOptions } from "./types.js";
import type { IAdminUser, IPost, ISeries, ITag } from "../types/model.db.js";

type AnyDoc = Record<string, unknown> & { _id: string };

/** MongoDB-ish 24-hex ObjectId so ids look and sort like the real thing. */
function objectId(): string {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  return timestamp + randomBytes(8).toString("hex");
}

class MemoryCollection<T extends { _id: string }> implements Collection<T> {
  constructor(
    private docs: AnyDoc[],
    private readonly persist: () => void
  ) {}

  private clone(doc: AnyDoc): T {
    return structuredClone(doc) as unknown as T;
  }

  async find(filter: Record<string, unknown>, options: FindOptions = {}): Promise<T[]> {
    const pipeline: Record<string, unknown>[] = [{ $match: filter ?? {} }];
    if (options.sort) pipeline.push({ $sort: options.sort });
    if (options.skip) pipeline.push({ $skip: options.skip });
    if (options.limit) pipeline.push({ $limit: options.limit });
    if (options.projection) pipeline.push({ $project: options.projection });
    const result = new Aggregator(pipeline).run(this.docs) as AnyDoc[];
    return result.map((d) => structuredClone(d) as unknown as T);
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const query = new Query(filter ?? {}, {});
    const found = this.docs.find((doc) => query.test(doc));
    return found ? this.clone(found) : null;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ _id: id });
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    const query = new Query(filter ?? {}, {});
    return this.docs.filter((doc) => query.test(doc)).length;
  }

  async create(doc: Partial<T>): Promise<T> {
    const now = new Date();
    const record = {
      _id: objectId(),
      createdAt: now,
      updatedAt: now,
      ...(doc as Record<string, unknown>),
    } as AnyDoc;
    this.docs.push(record);
    this.persist();
    return this.clone(record);
  }

  async updateById(id: string, patch: Partial<T>): Promise<T | null> {
    const index = this.docs.findIndex((doc) => doc._id === id);
    if (index === -1) return null;
    const existing = this.docs[index] as AnyDoc;
    const updated: AnyDoc = {
      ...existing,
      ...(patch as Record<string, unknown>),
      _id: existing._id,
      updatedAt: new Date(),
    };
    this.docs[index] = updated;
    this.persist();
    return this.clone(updated);
  }

  async deleteById(id: string): Promise<boolean> {
    const index = this.docs.findIndex((doc) => doc._id === id);
    if (index === -1) return false;
    this.docs.splice(index, 1);
    this.persist();
    return true;
  }

  async aggregate<R = Record<string, unknown>>(
    pipeline: Record<string, unknown>[]
  ): Promise<R[]> {
    return structuredClone(new Aggregator(pipeline).run(this.docs)) as R[];
  }

  async increment(id: string, field: string, by: number): Promise<void> {
    const doc = this.docs.find((d) => d._id === id);
    if (!doc) return;
    doc[field] = ((doc[field] as number) ?? 0) + by;
    this.persist();
  }
}

interface Snapshot {
  posts: AnyDoc[];
  series: AnyDoc[];
  tags: AnyDoc[];
  users: AnyDoc[];
}

/** Revive ISO date strings back into Date objects after JSON round-trip. */
const DATE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "publishedAt",
]);

function reviveDates(docs: AnyDoc[]): AnyDoc[] {
  return docs.map((doc) => {
    const copy: AnyDoc = { ...doc };
    for (const key of Object.keys(copy)) {
      if (DATE_KEYS.has(key) && typeof copy[key] === "string") {
        copy[key] = new Date(copy[key] as string);
      }
    }
    return copy;
  });
}

export function createMemoryDatabase(persistPath?: string): Database {
  const store: Snapshot = { posts: [], series: [], tags: [], users: [] };

  if (persistPath && existsSync(persistPath)) {
    try {
      const raw = JSON.parse(readFileSync(persistPath, "utf8")) as Snapshot;
      store.posts = reviveDates(raw.posts ?? []);
      store.series = reviveDates(raw.series ?? []);
      store.tags = reviveDates(raw.tags ?? []);
      store.users = reviveDates(raw.users ?? []);
    } catch {
      // A corrupt dev snapshot should never block startup — start empty.
    }
  }

  const persist = () => {
    if (!persistPath) return;
    try {
      mkdirSync(dirname(persistPath), { recursive: true });
      writeFileSync(persistPath, JSON.stringify(store), "utf8");
    } catch {
      /* best-effort only */
    }
  };

  return {
    driver: "memory",
    posts: new MemoryCollection<IPost>(store.posts, persist),
    series: new MemoryCollection<ISeries>(store.series, persist),
    tags: new MemoryCollection<ITag>(store.tags, persist),
    users: new MemoryCollection<IAdminUser>(store.users, persist),
    async disconnect() {
      persist();
    },
  };
}
