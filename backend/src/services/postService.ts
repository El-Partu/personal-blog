import type { Paginated, PostSummary } from "@blog/shared";
import { getDatabase } from "../db/index.js";
import type { IPost } from "../types/model.db.js";
import { toPostSummary } from "../serializers/index.js";
import { escapeRegex, toSlug } from "../utils/content.js";
import type { PostListQueryInput } from "../schema/content.schema.js";

/**
 * Build the Mongo filter for a listing request.
 *
 * `includeDrafts` is false for every public route, so unpublished work can
 * never leak; the admin listing passes true.
 */
export function buildPostFilter(
  query: PostListQueryInput,
  includeDrafts: boolean
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (includeDrafts) {
    if (query.status) filter.status = query.status;
  } else {
    filter.status = "published";
  }

  if (query.tag) filter.tags = query.tag;
  if (query.category) filter.category = query.category;
  if (query.series) filter.seriesId = query.series;

  if (query.q) {
    // Case-insensitive regex across the searchable fields. A real MongoDB
    // deployment also has the weighted `post_text_index` available; regex is
    // used here because it behaves identically on both storage drivers and
    // supports partial-word matching, which $text does not.
    const pattern = escapeRegex(query.q);
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { excerpt: { $regex: pattern, $options: "i" } },
      { content: { $regex: pattern, $options: "i" } },
      { tags: { $regex: pattern, $options: "i" } },
      { category: { $regex: pattern, $options: "i" } },
    ];
  }

  return filter;
}

function buildSort(sort: PostListQueryInput["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "oldest":
      return { publishedAt: 1, createdAt: 1 };
    case "popular":
      return { viewCount: -1, publishedAt: -1 };
    default:
      return { publishedAt: -1, createdAt: -1 };
  }
}

export async function listPosts(
  query: PostListQueryInput,
  includeDrafts = false
): Promise<Paginated<PostSummary>> {
  const db = getDatabase();
  const filter = buildPostFilter(query, includeDrafts);
  const sort = includeDrafts ? { updatedAt: -1 as const } : buildSort(query.sort);

  const total = await db.posts.count(filter);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);

  const docs = await db.posts.find(filter, {
    sort,
    skip: (page - 1) * query.limit,
    limit: query.limit,
  });

  return {
    items: docs.map(toPostSummary),
    page,
    limit: query.limit,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

/** Ensure a slug is unique, appending -2, -3 … when it is not. */
export async function ensureUniqueSlug(desired: string, ignoreId?: string): Promise<string> {
  const db = getDatabase();
  const base = toSlug(desired) || "post";
  let candidate = base;
  let suffix = 2;

  for (;;) {
    const existing = await db.posts.findOne({ slug: candidate });
    if (!existing || (ignoreId && String(existing._id) === ignoreId)) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

/**
 * Related posts by shared tags (Section 3.1). Scored by tag overlap using an
 * aggregation pipeline, falling back to same-category posts when a post has
 * no tag matches.
 */
export async function findRelatedPosts(post: IPost, limit = 3): Promise<PostSummary[]> {
  const db = getDatabase();
  const tags = post.tags ?? [];

  if (tags.length > 0) {
    const related = await db.posts.aggregate<IPost & { matchCount: number }>([
      {
        $match: {
          status: "published",
          _id: { $ne: String(post._id) },
          tags: { $in: tags },
        },
      },
      {
        $addFields: {
          matchCount: { $size: { $setIntersection: ["$tags", tags] } },
        },
      },
      { $sort: { matchCount: -1, publishedAt: -1 } },
      { $limit: limit },
    ]);
    if (related.length > 0) return related.map(toPostSummary);
  }

  const sameCategory = await db.posts.find(
    {
      status: "published",
      category: post.category,
      _id: { $ne: String(post._id) },
    },
    { sort: { publishedAt: -1 }, limit }
  );
  return sameCategory.map(toPostSummary);
}

/** Previous/next navigation within a series, ordered by `seriesOrder`. */
export async function getSeriesNavigation(post: IPost) {
  if (!post.seriesId) return undefined;
  const db = getDatabase();

  const siblings = await db.posts.find(
    { seriesId: String(post.seriesId), status: "published" },
    { sort: { seriesOrder: 1, publishedAt: 1 } }
  );

  const index = siblings.findIndex((p) => String(p._id) === String(post._id));
  if (index === -1) return undefined;

  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index < siblings.length - 1 ? siblings[index + 1] : undefined;

  return {
    ...(previous ? { previous: toPostSummary(previous) } : {}),
    ...(next ? { next: toPostSummary(next) } : {}),
    position: index + 1,
    total: siblings.length,
  };
}
