"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PostSummary } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import { listPosts, listSeries, listTags } from "@/lib/adminClient";
import { formatShortDate } from "@/lib/format";

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [counts, setCounts] = useState({ total: 0, published: 0, drafts: 0, series: 0, tags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listPosts({ page: 1 }), listSeries(), listTags()])
      .then(([postsResult, series, tags]) => {
        const items = postsResult.items;
        setPosts(items.slice(0, 6));
        setCounts({
          total: postsResult.total,
          published: items.filter((post) => post.status === "published").length,
          drafts: items.filter((post) => post.status === "draft").length,
          series: series.length,
          tags: tags.length,
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Posts", value: counts.total },
    { label: "Published", value: counts.published },
    { label: "Drafts", value: counts.drafts },
    { label: "Series", value: counts.series },
    { label: "Tags", value: counts.tags },
  ];

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            Everything you&apos;ve written, at a glance.
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary">
          + New post
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
          >
            <dt className="u-meta">{stat.label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold">{loading ? "—" : stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recently edited</h2>
          <Link
            href="/admin/posts"
            className="text-sm transition-colors hover:text-[var(--accent)]"
            style={{ color: "var(--fg-muted)" }}
          >
            All posts →
          </Link>
        </div>

        {loading ? (
          <p className="u-meta">Loading…</p>
        ) : posts.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-10 text-center"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <p className="font-medium">No posts yet</p>
            <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
              Write your first one, or run the seed script for sample content.
            </p>
            <Link href="/admin/posts/new" className="btn btn-primary mt-5">
              Write a post
            </Link>
          </div>
        ) : (
          <ul
            className="divide-y overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
          >
            {posts.map((post) => (
              <li key={post._id} className="flex items-center gap-4 p-4">
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
                    <span className="u-meta">
                      {formatShortDate(post.updatedAt)} · {post.readTimeMinutes} min
                    </span>
                  </p>
                </div>
                <Link href={`/admin/posts/${post._id}`} className="btn btn-secondary shrink-0">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
