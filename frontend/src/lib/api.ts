import type {
  ApiSuccess,
  Paginated,
  Post,
  PostSummary,
  PostWithSeries,
  Series,
  SeriesWithPosts,
  Tag,
} from "@blog/shared";

/**
 * Server-side API base URL. Used by Server Components, which run inside the
 * container and can reach the API directly. Browser code must instead use the
 * relative `/api/...` path, which Next.js rewrites to the backend (see
 * next.config.ts) — never point the browser at the API host directly.
 */
const SERVER_API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Seconds before cached API data is revalidated (ISR). */
const REVALIDATE = Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS ?? 60);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

async function serverFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number | false }
): Promise<T> {
  const { revalidate, ...rest } = init ?? {};
  const url = `${SERVER_API_URL}/api/v1${path}`;

  const response = await fetch(url, {
    ...rest,
    headers: { Accept: "application/json", ...(rest.headers ?? {}) },
    next: revalidate === false ? undefined : { revalidate: revalidate ?? REVALIDATE },
    ...(revalidate === false ? { cache: "no-store" as const } : {}),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as ApiSuccess<T>;
  return payload.data;
}

/** Returns null on 404 instead of throwing — for pages that render notFound(). */
async function serverFetchOrNull<T>(
  path: string,
  init?: RequestInit & { revalidate?: number | false }
): Promise<T | null> {
  try {
    return await serverFetch<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface PostQuery {
  page?: number;
  limit?: number;
  tag?: string;
  category?: string;
  series?: string;
  q?: string;
  sort?: "newest" | "oldest" | "popular";
}

function toQueryString(query: PostQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function getPosts(query: PostQuery = {}): Promise<Paginated<PostSummary>> {
  return serverFetch<Paginated<PostSummary>>(`/posts${toQueryString(query)}`);
}

export function getPost(slug: string): Promise<PostWithSeries | null> {
  return serverFetchOrNull<PostWithSeries>(`/posts/${encodeURIComponent(slug)}`);
}

export function getRelatedPosts(slug: string): Promise<PostSummary[]> {
  return serverFetch<PostSummary[]>(`/posts/${encodeURIComponent(slug)}/related`);
}

export function getAllPostsForFeed(): Promise<Post[]> {
  return serverFetch<Post[]>("/posts/feed/all");
}

export function getTags(): Promise<Tag[]> {
  return serverFetch<Tag[]>("/tags");
}

export function getCategories(): Promise<Tag[]> {
  return serverFetch<Tag[]>("/categories");
}

export function getAllSeries(): Promise<(Series & { postCount: number })[]> {
  return serverFetch<(Series & { postCount: number })[]>("/series");
}

export function getSeries(slug: string): Promise<SeriesWithPosts | null> {
  return serverFetchOrNull<SeriesWithPosts>(`/series/${encodeURIComponent(slug)}`);
}

export interface AuthorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
}

export function getAuthor(): Promise<AuthorProfile | null> {
  return serverFetchOrNull<AuthorProfile>("/author");
}
