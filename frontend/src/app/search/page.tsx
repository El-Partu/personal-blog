import { Suspense } from "react";
import type { Metadata } from "next";
import SearchBox from "@/components/SearchBox";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getPosts } from "@/lib/api";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search",
  description: `Search articles on ${site.name} by title, content or tag.`,
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const result = query
    ? await getPosts({ q: query, page, limit: site.pageSize }).catch(() => null)
    : null;

  return (
    <div className="u-container py-12 md:py-16">
      <header className="mb-8">
        <p className="u-meta mb-3">Search</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {query ? `Results for “${query}”` : "Search the archive"}
        </h1>
        <div className="mt-6 max-w-lg">
          <Suspense fallback={null}>
            <SearchBox autoFocus placeholder="Search by title, content or tag…" />
          </Suspense>
        </div>
      </header>

      {!query && (
        <p className="py-12 text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
          Type a keyword above — searches run across post titles, body text, tags and
          categories.
        </p>
      )}

      {query && !result && (
        <p className="py-12 text-center" style={{ color: "var(--fg-muted)" }}>
          Search is unavailable right now. Please try again shortly.
        </p>
      )}

      {result && (
        <>
          <p className="mb-6 u-meta" role="status" aria-live="polite">
            {result.total} {result.total === 1 ? "result" : "results"}
          </p>

          {result.items.length === 0 ? (
            <div
              className="rounded-xl border border-dashed p-12 text-center"
              style={{ borderColor: "var(--border-strong)" }}
            >
              <p className="font-medium">No articles matched “{query}”.</p>
              <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
                Try a broader term, or browse by topic instead.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            basePath="/search"
            searchParams={{ q: query }}
          />
        </>
      )}
    </div>
  );
}
