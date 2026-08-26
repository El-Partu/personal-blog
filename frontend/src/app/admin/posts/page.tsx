"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PostSummary } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import { deletePost, listPosts } from "@/lib/adminClient";
import { formatShortDate } from "@/lib/format";

type StatusFilter = "" | "draft" | "published";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listPosts({ page, ...(status ? { status } : {}), ...(query ? { q: query } : {}) })
      .then((result) => {
        setPosts(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [page, status, query]);

  useEffect(load, [load]);

  const onDelete = async (post: PostSummary) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    await deletePost(post._id).catch(() => undefined);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {total} total
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary">
          + New post
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(
            [
              { value: "", label: "All" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Drafts" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setStatus(option.value);
                setPage(1);
              }}
              className="rounded-md border px-3 py-1.5 text-sm transition-colors"
              style={
                status === option.value
                  ? { borderColor: "var(--accent)", color: "var(--accent)", fontWeight: 550 }
                  : { borderColor: "var(--border)", color: "var(--fg-muted)" }
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="field-input ml-auto max-w-xs"
          placeholder="Filter by keyword…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          aria-label="Filter posts"
        />
      </div>

      {loading ? (
        <p className="u-meta">Loading…</p>
      ) : posts.length === 0 ? (
        <div
          className="rounded-lg border border-dashed p-12 text-center"
          style={{ borderColor: "var(--border-strong)" }}
        >
          <p className="font-medium">No posts match</p>
          <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
            Try clearing the filters, or write something new.
          </p>
        </div>
      ) : (
        <ul
          className="divide-y overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
        >
          {posts.map((post) => (
            <li key={post._id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/posts/${post._id}`}
                  className="block truncate font-medium hover:text-[var(--accent)]"
                >
                  {post.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`status-pill ${
                      post.status === "published" ? "status-published" : "status-draft"
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="u-meta">{post.category}</span>
                  <span className="u-meta">{formatShortDate(post.updatedAt)}</span>
                  <span className="u-meta">{post.viewCount} views</span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {post.status === "published" && (
                  <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-secondary">
                    View
                  </Link>
                )}
                <Link href={`/admin/posts/${post._id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button type="button" onClick={() => void onDelete(post)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Previous
          </button>
          <span className="u-meta">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </AdminShell>
  );
}
