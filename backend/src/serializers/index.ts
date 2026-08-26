import type {
  AdminUser,
  Post,
  PostSummary,
  Series,
  Tag,
} from "@blog/shared";
import type { IAdminUser, IPost, ISeries, ITag } from "../types/model.db.js";

const iso = (value: Date | string | undefined | null): string | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

/** Map a stored post document onto the shared wire shape. */
export function toPost(doc: IPost): Post {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? "",
    content: doc.content,
    ...(doc.coverImage ? { coverImage: doc.coverImage } : {}),
    status: doc.status,
    ...(iso(doc.publishedAt) ? { publishedAt: iso(doc.publishedAt)! } : {}),
    updatedAt: iso(doc.updatedAt) ?? new Date().toISOString(),
    createdAt: iso(doc.createdAt) ?? new Date().toISOString(),
    tags: doc.tags ?? [],
    category: doc.category ?? "Uncategorized",
    ...(doc.seriesId ? { seriesId: String(doc.seriesId) } : {}),
    ...(doc.seriesOrder !== null && doc.seriesOrder !== undefined
      ? { seriesOrder: doc.seriesOrder }
      : {}),
    readTimeMinutes: doc.readTimeMinutes ?? 1,
    ...(doc.seoTitle ? { seoTitle: doc.seoTitle } : {}),
    ...(doc.seoDescription ? { seoDescription: doc.seoDescription } : {}),
    viewCount: doc.viewCount ?? 0,
  };
}

/** Listing shape — drops `content` to keep list payloads small. */
export function toPostSummary(doc: IPost): PostSummary {
  const { content: _content, seoTitle: _t, seoDescription: _d, ...rest } = toPost(doc);
  return rest;
}

export function toSeries(doc: ISeries): Series {
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description ?? "",
  };
}

export function toTag(doc: ITag, postCount?: number): Tag {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    ...(postCount !== undefined ? { postCount } : {}),
  };
}

/** Never leaks `passwordHash`. */
export function toAdminUser(doc: IAdminUser): AdminUser {
  return {
    _id: String(doc._id),
    email: doc.email,
    name: doc.name,
    ...(doc.bio ? { bio: doc.bio } : {}),
    ...(doc.avatarUrl ? { avatarUrl: doc.avatarUrl } : {}),
  };
}
