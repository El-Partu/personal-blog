import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getTags } from "@/lib/api";
import { slugifyTag } from "@/lib/format";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse articles by topic and category.",
  alternates: { canonical: "/tags" },
};

export const revalidate = 60;

export default async function TagsPage() {
  const [tags, categories] = await Promise.all([
    getTags().catch(() => []),
    getCategories().catch(() => []),
  ]);

  return (
    <div className="u-container py-12 md:py-16">
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <p className="u-meta mb-3">Index</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Topics</h1>
        <p className="mt-3 max-w-xl text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
          Every tag and category used across the archive.
        </p>
      </header>

      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="mb-14">
          <h2 id="categories-heading" className="text-xl font-semibold tracking-tight">
            Categories
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${slugifyTag(category.name)}`}
                className="flex items-baseline justify-between rounded-lg border p-4 transition-colors hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="font-medium">{category.name}</span>
                <span className="u-meta">
                  {category.postCount} {category.postCount === 1 ? "post" : "posts"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="tags-heading">
        <h2 id="tags-heading" className="text-xl font-semibold tracking-tight">
          Tags
        </h2>
        {tags.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--fg-muted)" }}>
            No tags yet.
          </p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <li key={tag._id}>
                <Link
                  href={`/tags/${slugifyTag(tag.name)}`}
                  className="inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  {tag.name}
                  <span className="u-meta">{tag.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
