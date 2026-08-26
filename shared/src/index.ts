/**
 * Shared contract between the Express API and the Next.js frontend.
 *
 * These are the *wire* shapes: what the API serializes to JSON and what the
 * frontend receives. Dates cross the wire as ISO-8601 strings, so they are
 * typed `string` here. The Mongoose documents in the backend use real `Date`
 * objects and are mapped to these shapes by the serializers in
 * `backend/src/serializers`.
 */

export type PostStatus = "draft" | "published";

export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown / MDX source. */
  content: string;
  coverImage?: string;
  status: PostStatus;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  category: string;
  seriesId?: string;
  seriesOrder?: number;
  readTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
}

/** A post with its series resolved, as returned by the public post endpoint. */
export interface PostWithSeries extends Post {
  series?: Series;
  seriesNavigation?: SeriesNavigation;
}

export interface SeriesNavigation {
  previous?: PostSummary;
  next?: PostSummary;
  /** 1-based position of this post within the series. */
  position: number;
  total: number;
}

/** Trimmed post shape used by listings — omits the (potentially huge) body. */
export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  status: PostStatus;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  category: string;
  seriesId?: string;
  seriesOrder?: number;
  readTimeMinutes: number;
  viewCount: number;
}

export interface Series {
  _id: string;
  title: string;
  slug: string;
  description: string;
}

export interface SeriesWithPosts extends Series {
  posts: PostSummary[];
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  /** Number of published posts carrying this tag. Populated on list endpoints. */
  postCount?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  postCount?: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
}

/* ------------------------------------------------------------------ */
/* API envelopes                                                       */
/* ------------------------------------------------------------------ */

/** Every successful API response uses this envelope. */
export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiFailure {
  status: "fail" | "error";
  message: string;
  errors?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}

/* ------------------------------------------------------------------ */
/* Request payloads                                                    */
/* ------------------------------------------------------------------ */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status?: PostStatus;
  publishedAt?: string;
  tags?: string[];
  category?: string;
  seriesId?: string | null;
  seriesOrder?: number | null;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SeriesInput {
  title: string;
  slug?: string;
  description?: string;
}

export interface TagInput {
  name: string;
  slug?: string;
}

/** Query parameters accepted by `GET /api/v1/posts`. */
export interface PostListQuery {
  page?: number;
  limit?: number;
  tag?: string;
  category?: string;
  series?: string;
  q?: string;
  status?: PostStatus;
  sort?: "newest" | "oldest" | "popular";
}

export interface SearchResult extends PostSummary {
  /** MongoDB text-search relevance score, when the query used $text. */
  score?: number;
}

export interface UploadedImage {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: string;
}

/** Heading extracted from post markdown, used to build a table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

export const POST_STATUSES: readonly PostStatus[] = ["draft", "published"];

export const DEFAULT_PAGE_SIZE = 9;
