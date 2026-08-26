"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminStats } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import { BreakdownBars, PublishingChart } from "@/components/admin/StatCharts";
import { fetchStats } from "@/lib/adminClient";
import { formatShortDate } from "@/lib/format";

/**
 * Admin dashboard.
 *
 * All figures come from `GET /admin/stats`, which aggregates them in the
 * database. An earlier version counted published/draft posts from the first
 * page of results only, so the numbers silently went wrong past 20 posts.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load analytics.")
      )
      .finally(() => setLoading(false));
  }, []);

  const totals = stats?.totals;

  const headline = [
    { label: "Total views", value: totals?.views, hint: "All published posts, lifetime" },
    { label: "Published", value: totals?.published, hint: "Live on the site" },
    { label: "Drafts", value: totals?.drafts, hint: "Not yet public" },
    { label: "Words written", value: totals?.words, hint: "Prose only, excludes code" },
  ];

  const library = [
    { label: "Series", value: totals?.series },
    { label: "Tags", value: totals?.tags },
    { label: "Categories", value: totals?.categories },
    { label: "Reading time", value: totals?.readTimeMinutes, suffix: " min" },
  ];

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            How the blog is doing, and what still needs writing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/posts/new" className="btn btn-primary">
            + New post
          </Link>
          <Link href="/admin/tags" className="btn btn-secondary">
            Tags &amp; categories
          </Link>
        </div>
      </div>

      {error && (
        <p
          className="mb-6 rounded-lg border p-4 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        >
          {error}
        </p>
      )}

      {/* Headline numbers */}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {headline.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
          >
            <dt className="u-meta">{stat.label}</dt>
            <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
              {loading || stat.value === undefined
                ? "—"
                : stat.value.toLocaleString("en-GB")}
            </dd>
            <p className="mt-1 text-xs" style={{ color: "var(--fg-subtle)" }}>
              {stat.hint}
            </p>
          </div>
        ))}
      </dl>

      {/* Library counts */}
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {library.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <dt className="u-meta">{stat.label}</dt>
            <dd className="mt-1.5 text-xl font-semibold tabular-nums">
              {loading || stat.value === undefined
                ? "—"
                : `${stat.value.toLocaleString("en-GB")}${stat.suffix ?? ""}`}
            </dd>
          </div>
        ))}
      </dl>

      {/* Publishing cadence */}
      <section
        className="mt-8 rounded-lg border p-5"
        style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Publishing cadence</h2>
          <span className="u-meta">Last 12 months</span>
        </div>
        {loading || !stats ? (
          <div className="h-40 animate-pulse rounded" style={{ background: "var(--bg-subtle)" }} />
        ) : (
          <PublishingChart data={stats.publishing} />
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Most read */}
        <section
          className="rounded-lg border p-5"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
        >
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Most read</h2>
          {loading ? (
            <p className="u-meta">Loading…</p>
          ) : stats && stats.topPosts.length > 0 ? (
            <ol className="space-y-3">
              {stats.topPosts.map((post, index) => (
                <li key={post._id} className="flex items-baseline gap-3">
                  <span className="u-meta w-4 shrink-0 tabular-nums">{index + 1}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex-1 truncate text-sm hover:text-[var(--accent)]"
                    title={post.title}
                  >
                    {post.title}
                  </Link>
                  <span className="u-meta shrink-0 tabular-nums">
                    {post.viewCount.toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="u-meta py-6 text-center">No published posts yet.</p>
          )}
        </section>

        {/* Needs finishing */}
        <section
          className="rounded-lg border p-5"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
        >
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Needs finishing</h2>
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
          ) : stats && stats.pendingDrafts.length > 0 ? (
            <ul className="space-y-3">
              {stats.pendingDrafts.map((draft) => (
                <li key={draft._id} className="flex items-baseline gap-3">
                  <Link
                    href={`/admin/posts/${draft._id}`}
                    className="flex-1 truncate text-sm hover:text-[var(--accent)]"
                    title={draft.title}
                  >
                    {draft.title}
                  </Link>
                  <span className="u-meta shrink-0">{formatShortDate(draft.updatedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="u-meta py-6 text-center">No drafts — everything is published.</p>
          )}
        </section>

        {/* Categories */}
        <section
          className="rounded-lg border p-5"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
        >
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">By category</h2>
            <Link
              href="/admin/tags"
              className="text-sm transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--fg-muted)" }}
            >
              Manage →
            </Link>
          </div>
          {loading ? (
            <p className="u-meta">Loading…</p>
          ) : (
            <BreakdownBars data={stats?.byCategory ?? []} emptyLabel="No categories yet." />
          )}
        </section>

        {/* Tags */}
        <section
          className="rounded-lg border p-5"
          style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
        >
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Top tags</h2>
            <Link
              href="/admin/tags"
              className="text-sm transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--fg-muted)" }}
            >
              Manage →
            </Link>
          </div>
          {loading ? (
            <p className="u-meta">Loading…</p>
          ) : (
            <BreakdownBars data={stats?.byTag ?? []} emptyLabel="No tags yet." />
          )}
        </section>
      </div>

      <p className="mt-8 text-xs leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
        View counts are lifetime totals recorded by this site when a post page loads. They
        are not de-duplicated per visitor and include no referrer or geographic data — for
        that, add a privacy-friendly analytics provider alongside these figures.
      </p>
    </AdminShell>
  );
}
