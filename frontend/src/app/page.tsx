import Link from "next/link";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getAllSeries, getPosts, getTags } from "@/lib/api";
import { site } from "@/lib/site";
import { slugifyTag } from "@/lib/format";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function HomePage() {
  // One failing widget should not take down the homepage.
  const [postsResult, tagsResult, seriesResult] = await Promise.allSettled([
    getPosts({ limit: 7 }),
    getTags(),
    getAllSeries(),
  ]);

  const posts = postsResult.status === "fulfilled" ? postsResult.value.items : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value.slice(0, 12) : [];
  const allSeries = seriesResult.status === "fulfilled" ? seriesResult.value : [];

  const [featured, ...rest] = posts;

  if (postsResult.status === "rejected") {
    return (
      <div className="u-container py-24 text-center">
        <h1 className="text-2xl font-semibold">Unable to load posts</h1>
        <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: "var(--fg-muted)" }}>
          The API is not reachable. Make sure the backend service is running and
          that <code>API_URL</code> points at it.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Masthead */}
      <section className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="u-container py-16 md:py-24">
          <p className="u-meta mb-4">Notes from a CS degree</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            {site.tagline}
          </h1>
          <p
            className="mt-6 max-w-xl text-[1.05rem] leading-relaxed"
            style={{ color: "var(--fg-muted)" }}
          >
            {site.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              Read the archive
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/series"
              className="inline-flex items-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              Browse series
            </Link>
          </div>
        </div>
      </section>

      <div className="u-container py-14 md:py-16">
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Lead story */}
            {featured && (
              <section aria-labelledby="latest-heading" className="mb-14">
                <h2 id="latest-heading" className="u-meta mb-4">
                  Latest
                </h2>
                <PostCard post={featured} featured />
              </section>
            )}

            {/* Magazine grid */}
            {rest.length > 0 && (
              <section aria-labelledby="recent-heading">
                <div className="mb-5 flex items-baseline justify-between">
                  <h2 id="recent-heading" className="text-xl font-semibold tracking-tight">
                    Recent articles
                  </h2>
                  <Link
                    href="/blog"
                    className="text-sm transition-colors hover:text-[var(--accent)]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    All articles →
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Series + topics */}
        {(allSeries.length > 0 || tags.length > 0) && (
          <div className="mt-20 grid gap-12 border-t pt-14 md:grid-cols-2" style={{ borderColor: "var(--border)" }}>
            {allSeries.length > 0 && (
              <section aria-labelledby="series-heading">
                <h2 id="series-heading" className="text-lg font-semibold tracking-tight">
                  Ongoing series
                </h2>
                <ul className="mt-4 space-y-3">
                  {allSeries.map((series) => (
                    <li key={series._id}>
                      <Link
                        href={`/series/${series.slug}`}
                        className="group block rounded-lg border p-4 transition-colors hover:border-[var(--accent)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{series.title}</span>
                          <span className="u-meta shrink-0">{series.postCount} parts</span>
                        </div>
                        <p
                          className="mt-1.5 line-clamp-2 text-sm leading-relaxed"
                          style={{ color: "var(--fg-muted)" }}
                        >
                          {series.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tags.length > 0 && (
              <section aria-labelledby="topics-heading">
                <h2 id="topics-heading" className="text-lg font-semibold tracking-tight">
                  Topics
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag._id}>
                      <Link
                        href={`/tags/${slugifyTag(tag.name)}`}
                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        {tag.name}
                        <span className="u-meta">{tag.postCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed p-12 text-center"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <h2 className="text-lg font-semibold">No posts yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--fg-muted)" }}>
        Run <code className="rounded bg-[var(--code-bg)] px-1.5 py-0.5">npm run seed</code> to load
        the sample articles, or sign in to the admin panel and write your first post.
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-block rounded-md px-4 py-2 text-sm font-medium"
        style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
      >
        Go to admin
      </Link>
    </div>
  );
}
