/**
 * Mongoose-backed implementation of the `Database` interface — the production
 * path. Used whenever `MONGODB_URI` is set.
 */
import mongoose, { type Model } from "mongoose";
import type { Collection, Database, FindOptions } from "./types.js";
import Post from "../models/postModel.js";
import Series from "../models/seriesModel.js";
import Tag from "../models/tagModel.js";
import AdminUser from "../models/adminUserModel.js";
import type { IAdminUser, IPost, ISeries, ITag } from "../types/model.db.js";

/**
 * Mongoose's query generics are extremely deep and vary by call shape, which
 * makes them impractical to thread through a generic wrapper. Queries are
 * therefore handled as `any` at this boundary only; every value leaving the
 * class is normalised back into the typed document shape by `toPlain`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyQuery = any;

class MongooseCollection<T extends { _id: string }> implements Collection<T> {
  constructor(
    private readonly model: Model<T>,
    /** Fields excluded by `select: false` that some call sites need back. */
    private readonly selectExtra?: string
  ) {}

  private toPlain(doc: unknown): T {
    const plain = JSON.parse(JSON.stringify(doc)) as T;
    return plain;
  }

  async find(filter: Record<string, unknown>, options: FindOptions = {}): Promise<T[]> {
    let query: AnyQuery = this.model.find(filter as never).lean();
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    if (options.projection) query = query.select(options.projection);
    const docs = (await query.exec()) as unknown[];
    return docs.map((d) => this.toPlain(d));
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    let query: AnyQuery = this.model.findOne(filter as never);
    if (this.selectExtra) query = query.select(this.selectExtra);
    const doc = (await query.lean().exec()) as unknown;
    return doc ? this.toPlain(doc) : null;
  }

  async findById(id: string): Promise<T | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).lean().exec();
    return doc ? this.toPlain(doc) : null;
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return this.model.countDocuments(filter as never).exec();
  }

  async create(doc: Partial<T>): Promise<T> {
    const created = (await this.model.create(doc as never)) as unknown as {
      toObject(): unknown;
    };
    return this.toPlain(created.toObject());
  }

  async updateById(id: string, patch: Partial<T>): Promise<T | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    // `runValidators` keeps schema rules active on updates, not just saves.
    const updated = await this.model
      .findByIdAndUpdate(id, patch as never, { new: true, runValidators: true })
      .lean()
      .exec();
    return updated ? this.toPlain(updated) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) return false;
    const result = await this.model.findByIdAndDelete(id).exec();
    return Boolean(result);
  }

  async aggregate<R = Record<string, unknown>>(
    pipeline: Record<string, unknown>[]
  ): Promise<R[]> {
    return this.model.aggregate(pipeline as never[]).exec() as Promise<R[]>;
  }

  async increment(id: string, field: string, by: number): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return;
    await this.model.updateOne({ _id: id } as never, { $inc: { [field]: by } } as never).exec();
  }
}

export async function createMongooseDatabase(uri: string): Promise<Database> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });

  return {
    driver: "mongodb",
    posts: new MongooseCollection<IPost>(Post),
    series: new MongooseCollection<ISeries>(Series),
    tags: new MongooseCollection<ITag>(Tag),
    // The admin login needs the hash back, which the schema hides by default.
    users: new MongooseCollection<IAdminUser>(AdminUser, "+passwordHash"),
    async disconnect() {
      await mongoose.disconnect();
    },
  };
}
