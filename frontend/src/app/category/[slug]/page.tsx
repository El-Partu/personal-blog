import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getCategories, getPosts } from "@/lib/api";
import { site } from "@/lib/site";
import { slugifyTag } from "@/lib/format";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

async function resolveCategoryName(slug: string): Promise<string | null> {
  const categories = await getCategories().catch(() => []);
  const match = categories.find((category) => slugifyTag(category.name) === slug);
  return match?.name ?? null;
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({ slug: slugifyTag(category.name) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = await resolveCategoryName(slug);
  if (!name) return { title: "Category not found" };

  return {
    title: `${name}`,
    description: `Articles filed under ${name} on ${site.name}.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryArchivePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  const name = await resolveCategoryName(slug);
  if (!name) notFound();

  const result = await getPosts({ category: name, page, limit: site.pageSize }).catch(() => null);
  if (!result) notFound();

  return (
    <div className="u-container py-12 md:py-16">
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <nav aria-label="Breadcrumb" className="mb-4">
          <Link href="/tags" className="u-meta hover:text-[var(--accent)]">
            ← All topics
          </Link>
        </nav>
        <p className="u-meta mb-3">Category</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>
        <p className="mt-3 text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
          {result.total} {result.total === 1 ? "article" : "articles"} in this category.
        </p>
      </header>

      {result.items.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--fg-muted)" }}>
          Nothing here yet.
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
        basePath={`/category/${slug}`}
      />
    </div>
  );
}
