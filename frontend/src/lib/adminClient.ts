"use client";

import type {
  AdminStats,
  AdminUser,
  ApiSuccess,
  AuthResponse,
  Paginated,
  Post,
  PostSummary,
  Series,
  Tag,
  UploadedImage,
} from "@blog/shared";

/**
 * Browser-side API client for the admin panel.
 *
 * All requests use the relative `/api` path, which Next.js rewrites to the
 * Express service — the browser never needs to know the API's real host.
 * The JWT is kept in localStorage and sent as a Bearer token.
 */

const TOKEN_KEY = "blog_admin_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage blocked */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string>
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      window.location.href = "/admin/login";
    }
    throw new AdminApiError("Your session has expired. Please sign in again.", 401);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as
    | ApiSuccess<T>
    | { message?: string; errors?: Record<string, string> };

  if (!response.ok) {
    const failure = payload as { message?: string; errors?: Record<string, string> };
    throw new AdminApiError(
      failure.message ?? `Request failed (${response.status})`,
      response.status,
      failure.errors
    );
  }

  return (payload as ApiSuccess<T>).data;
}

/* ---- auth ---- */

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<AdminUser> {
  return request<AdminUser>("/auth/me");
}

export function updateProfile(patch: {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<AdminUser> {
  return request<AdminUser>("/auth/me", { method: "PATCH", body: JSON.stringify(patch) });
}

export async function logout(): Promise<void> {
  await request<unknown>("/auth/logout", { method: "POST" }).catch(() => undefined);
  clearToken();
}

/* ---- posts ---- */

/* ---------------------------------------------------------------- */
/* Analytics                                                        */
/* ---------------------------------------------------------------- */

/** Dashboard analytics, aggregated server-side. */
export function fetchStats(): Promise<AdminStats> {
  return request<AdminStats>("/admin/stats");
}

export function listPosts(params: { page?: number; q?: string; status?: string } = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  const query = search.toString();
  return request<Paginated<PostSummary>>(`/admin/posts${query ? `?${query}` : ""}`);
}

export function getPost(id: string): Promise<Post> {
  return request<Post>(`/admin/posts/${id}`);
}

export function createPost(body: Record<string, unknown>): Promise<Post> {
  return request<Post>("/admin/posts", { method: "POST", body: JSON.stringify(body) });
}

export function updatePost(id: string, body: Record<string, unknown>): Promise<Post> {
  return request<Post>(`/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deletePost(id: string): Promise<void> {
  return request<void>(`/admin/posts/${id}`, { method: "DELETE" });
}

/* ---- series ---- */

export function listSeries(): Promise<(Series & { postCount: number })[]> {
  return request<(Series & { postCount: number })[]>("/admin/series");
}

export function createSeries(body: {
  title: string;
  slug?: string;
  description?: string;
}): Promise<Series> {
  return request<Series>("/admin/series", { method: "POST", body: JSON.stringify(body) });
}

export function updateSeries(id: string, body: Record<string, unknown>): Promise<Series> {
  return request<Series>(`/admin/series/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteSeries(id: string): Promise<void> {
  return request<void>(`/admin/series/${id}`, { method: "DELETE" });
}

export function reorderSeries(id: string, postIds: string[]): Promise<PostSummary[]> {
  return request<PostSummary[]>(`/admin/series/${id}/order`, {
    method: "PATCH",
    body: JSON.stringify({ postIds }),
  });
}

/* ---- tags ---- */

export function listTags(): Promise<Tag[]> {
  return request<Tag[]>("/admin/tags");
}

export function createTag(name: string): Promise<Tag> {
  return request<Tag>("/admin/tags", { method: "POST", body: JSON.stringify({ name }) });
}

export function deleteTag(id: string): Promise<void> {
  return request<void>(`/admin/tags/${id}`, { method: "DELETE" });
}

/* ---- uploads ---- */

export function listImages(): Promise<UploadedImage[]> {
  return request<UploadedImage[]>("/admin/uploads");
}

export function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("image", file);
  return request<UploadedImage>("/admin/uploads", { method: "POST", body: form });
}

export function deleteImage(publicId: string): Promise<void> {
  return request<void>(`/admin/uploads/${encodeURIComponent(publicId)}`, { method: "DELETE" });
}
