/**
 * Seed the database with the admin account and sample posts.
 *
 *   npm run seed            # from the repo root
 *
 * Safe to re-run: it clears the posts/series/tags collections first, and
 * upserts the admin account rather than duplicating it.
 */
import bcrypt from "bcryptjs";
import { connectDatabase, getDatabase } from "../db/index.js";
import { env } from "../config/env.js";
import { calculateReadTime, toSlug } from "../utils/content.js";
import { seedPosts, seedSeries } from "./seedData.js";
import type { IPost } from "../types/model.db.js";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seed() {
  const db = await connectDatabase();

  // ---- Admin account -------------------------------------------------
  const existingAdmin = await db.users.findOne({ email: env.admin.email.toLowerCase() });
  const passwordHash = await bcrypt.hash(env.admin.password, 12);

  if (existingAdmin) {
    await db.users.updateById(String(existingAdmin._id), {
      passwordHash,
      name: env.admin.name,
    });
    console.log(`[seed] updated admin account: ${env.admin.email}`);
  } else {
    await db.users.create({
      email: env.admin.email.toLowerCase(),
      passwordHash,
      name: env.admin.name,
      bio:
        "Computer science student writing up what I learn — algorithms, systems, " +
        "databases and the occasional side project. These notes are mostly for me, " +
        "but I publish them in case they help someone searching for the same thing.",
      avatarUrl: "",
    });
    console.log(`[seed] created admin account: ${env.admin.email}`);
  }

  // ---- Clear existing content ---------------------------------------
  for (const collection of [db.posts, db.series, db.tags] as const) {
    const all = await collection.find({});
    await Promise.all(all.map((doc) => collection.deleteById(String(doc._id))));
  }

  // ---- Series --------------------------------------------------------
  const seriesIdBySlug = new Map<string, string>();
  for (const series of seedSeries) {
    const created = await db.series.create(series);
    seriesIdBySlug.set(series.slug, String(created._id));
  }
  console.log(`[seed] created ${seedSeries.length} series`);

  // ---- Posts ---------------------------------------------------------
  const tagNames = new Set<string>();

  for (const post of seedPosts) {
    const publishedAt = daysAgo(post.daysAgo);
    const doc: Partial<IPost> = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: "published",
      publishedAt,
      createdAt: publishedAt,
      updatedAt: publishedAt,
      tags: post.tags,
      category: post.category,
      readTimeMinutes: calculateReadTime(post.content),
      viewCount: post.viewCount,
      seriesId: post.seriesSlug ? (seriesIdBySlug.get(post.seriesSlug) ?? null) : null,
      seriesOrder: post.seriesOrder ?? null,
    };
    if (post.coverImage) doc.coverImage = post.coverImage;
    if (post.seoTitle) doc.seoTitle = post.seoTitle;
    if (post.seoDescription) doc.seoDescription = post.seoDescription;

    await db.posts.create(doc);
    post.tags.forEach((tag) => tagNames.add(tag));
  }
  console.log(`[seed] created ${seedPosts.length} published posts`);

  // ---- A draft, so the admin UI has one to show ----------------------
  await db.posts.create({
    title: "Draft: Consistent Hashing Notes",
    slug: "draft-consistent-hashing-notes",
    excerpt: "Work in progress — notes on consistent hashing and virtual nodes.",
    content:
      "# Consistent Hashing\n\nStill working through this one. The key idea is mapping both " +
      "servers and keys onto the same ring so that adding a node only moves $K/n$ keys.\n\n" +
      "```python\ndef hash_ring_position(key: str, ring_size: int) -> int:\n" +
      "    return int(hashlib.md5(key.encode()).hexdigest(), 16) % ring_size\n```\n",
    status: "draft",
    tags: ["Systems", "Distributed Systems"],
    category: "Systems",
    readTimeMinutes: 1,
    viewCount: 0,
    seriesId: null,
    seriesOrder: null,
  });
  console.log("[seed] created 1 draft post");

  // ---- Tags ----------------------------------------------------------
  for (const name of tagNames) {
    await db.tags.create({ name, slug: toSlug(name) });
  }
  console.log(`[seed] created ${tagNames.size} tags`);

  await db.disconnect();
  console.log("\n[seed] done.");
  console.log(`[seed] log in at /admin/login with ${env.admin.email} / ${env.admin.password}`);
}

seed().catch((error) => {
  console.error("[seed] failed:", error);
  process.exit(1);
});
