import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getCategories, getPosts } from "@/lib/api";
import { site } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import {
  absoluteUrl,
  breadcrumbSchema,
  itemListSchema,
  webPageSchema,
  type Crumb,
} from "@/lib/seo";
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  const name = await resolveCategoryName(slug);
  if (!name) return { title: "Category not found" };

  // Page 2+ self-canonicalises so its posts stay indexable.
  const suffix = page > 1 ? `?page=${page}` : "";

  return {
    title: page > 1 ? `${name} — page ${page}` : `${name}`,
    description: `Articles filed under ${name} on ${site.name}.`,
    alternates: { canonical: `/category/${slug}${suffix}` },
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

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Topics", path: "/tags" },
    { name, path: `/category/${slug}` },
  ];
  const url = absoluteUrl(`/category/${slug}`);

  const schemas = [
    webPageSchema({
      url,
      name: `${name} — ${site.name}`,
      description: `${result.total} articles about ${name} on ${site.name}.`,
      crumbs,
      type: "CollectionPage",
    }),
    itemListSchema(result.items, url, `Articles about ${name}`),
    breadcrumbSchema(crumbs, url),
  ];

  return (
    <div className="u-container py-12 md:py-16">
      <JsonLd schemas={schemas} />
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <Breadcrumbs crumbs={crumbs} className="mb-4" />
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
