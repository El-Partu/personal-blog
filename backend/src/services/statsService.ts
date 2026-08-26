import type { AdminStats } from "@blog/shared";
import { getDatabase } from "../db/index.js";
import type { IPost } from "../types/model.db.js";

/**
 * Analytics for the admin dashboard.
 *
 * Everything is computed with aggregation pipelines rather than by pulling all
 * posts into memory and counting in JS — that keeps the cost flat as the blog
 * grows, and it works identically on both storage drivers (the memory driver
 * evaluates real Mongo operators via mingo).
 *
 * Note on views: `viewCount` is a lifetime counter incremented by
 * `POST /posts/:slug/view`. It is a genuine engagement signal but it is not a
 * substitute for a real analytics product — there is no per-day time series,
 * no unique-visitor tracking, no referrer data. See the README.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const db = getDatabase();

  const [
    posts,
    published,
    drafts,
    seriesCount,
    tagCount,
    totalsAgg,
    topPostDocs,
    byCategoryAgg,
    byTagAgg,
    publishingAgg,
    draftDocs,
  ] = await Promise.all([
    db.posts.count({}),
    db.posts.count({ status: "published" }),
    db.posts.count({ status: "draft" }),
    db.series.count({}),
    db.tags.count({}),

    // Lifetime views + total reading time across published posts.
    db.posts.aggregate<{ _id: null; views: number; readTimeMinutes: number }>([
      { $match: { status: "published" } },
      {
        $group: {
          _id: null,
          views: { $sum: "$viewCount" },
          readTimeMinutes: { $sum: "$readTimeMinutes" },
        },
      },
    ]),

    db.posts.find(
      { status: "published" },
      { sort: { viewCount: -1, publishedAt: -1 }, limit: 5 }
    ),

    db.posts.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),

    db.posts.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
    ]),

    db.posts.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$publishedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    db.posts.find({ status: "draft" }, { sort: { updatedAt: -1 }, limit: 5 }),
  ]);

  const totals = totalsAgg[0] ?? { views: 0, readTimeMinutes: 0 };

  // Word count is derived from the markdown body, so it cannot be aggregated
  // by Mongo directly. Only the body field is needed.
  const bodies = await db.posts.find(
    { status: "published" },
    { projection: { content: 1 } }
  );
  const words = bodies.reduce((sum, post) => sum + countWords(post.content ?? ""), 0);

  const categories = byCategoryAgg.filter((row) => Boolean(row._id));

  return {
    totals: {
      posts,
      published,
      drafts,
      series: seriesCount,
      tags: tagCount,
      categories: categories.length,
      views: totals.views ?? 0,
      words,
      readTimeMinutes: totals.readTimeMinutes ?? 0,
    },
    topPosts: topPostDocs.map((post) => ({
      _id: String(post._id),
      title: post.title,
      slug: post.slug,
      viewCount: post.viewCount ?? 0,
      ...(post.publishedAt ? { publishedAt: new Date(post.publishedAt).toISOString() } : {}),
    })),
    byCategory: categories.map((row) => ({ label: row._id, value: row.count })),
    byTag: byTagAgg
      .filter((row) => Boolean(row._id))
      .map((row) => ({ label: row._id, value: row.count })),
    publishing: buildPublishingSeries(publishingAgg),
    pendingDrafts: draftDocs.map((post) => ({
      _id: String(post._id),
      title: post.title,
      slug: post.slug,
      updatedAt: new Date(post.updatedAt).toISOString(),
    })),
  };
}

/**
 * Expand the aggregation result into a dense 12-month series.
 *
 * Months with no posts must still appear as zero, otherwise the chart silently
 * compresses gaps and makes an irregular publishing habit look consistent.
 */
function buildPublishingSeries(
  rows: { _id: string; count: number }[]
): { month: string; count: number }[] {
  const counts = new Map(rows.filter((row) => Boolean(row._id)).map((r) => [r._id, r.count]));
  const series: { month: string; count: number }[] = [];
  const now = new Date();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    series.push({ month, count: counts.get(month) ?? 0 });
  }

  return series;
}

/** Prose word count — fenced code and inline maths are excluded. */
function countWords(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ");
  const words = prose.match(/\b[\p{L}\p{N}'-]+\b/gu);
  return words ? words.length : 0;
}

export type { IPost };
