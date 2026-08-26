import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getPosts } from "@/lib/api";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Articles",
  description: `Every article on ${site.name} — study notes on algorithms, systems, databases and more.`,
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ page?: string; sort?: string }>;
};

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const sort = (["newest", "oldest", "popular"] as const).includes(
    params.sort as "newest" | "oldest" | "popular"
  )
    ? (params.sort as "newest" | "oldest" | "popular")
    : "newest";

  const result = await getPosts({ page, limit: site.pageSize, sort }).catch(() => null);

  if (!result) {
    return (
      <div className="u-container py-24 text-center">
        <h1 className="text-2xl font-semibold">Unable to load articles</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--fg-muted)" }}>
          The API is not reachable right now.
        </p>
      </div>
    );
  }

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "popular", label: "Most read" },
  ] as const;

  return (
    <div className="u-container py-12 md:py-16">
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <p className="u-meta mb-3">Archive</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">All articles</h1>
        <p className="mt-3 max-w-xl text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
          {result.total} {result.total === 1 ? "article" : "articles"} on algorithms, operating
          systems, databases and everything else I&apos;m studying.
        </p>

        <nav aria-label="Sort articles" className="mt-6 flex flex-wrap gap-2">
          {sortOptions.map((option) => {
            const isActive = sort === option.value;
            const href =
              option.value === "newest" ? "/blog" : `/blog?sort=${option.value}`;
            return (
              <a
                key={option.value}
                href={href}
                aria-current={isActive ? "true" : undefined}
                className="rounded-md border px-3 py-1.5 text-sm transition-colors"
                style={
                  isActive
                    ? {
                        borderColor: "var(--accent)",
                        color: "var(--accent)",
                        fontWeight: 550,
                      }
                    : { borderColor: "var(--border)", color: "var(--fg-muted)" }
                }
              >
                {option.label}
              </a>
            );
          })}
        </nav>
      </header>

      {result.items.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--fg-muted)" }}>
          No articles published yet.
        </p>
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
        basePath="/blog"
        searchParams={{ sort: sort === "newest" ? undefined : sort }}
      />
    </div>
  );
}
