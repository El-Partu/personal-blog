import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSeries, getSeries } from "@/lib/api";
import { formatShortDate, toIsoDate } from "@/lib/format";
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

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const allSeries = await getAllSeries();
    return allSeries.map((series) => ({ slug: series.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeries(slug).catch(() => null);
  if (!series) return { title: "Series not found" };

  return {
    title: series.title,
    description: series.description || `The ${series.title} series on ${site.name}.`,
    alternates: { canonical: `/series/${slug}` },
    openGraph: {
      type: "website",
      title: series.title,
      description: series.description,
    },
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeries(slug).catch(() => null);

  if (!series) notFound();

  const totalMinutes = series.posts.reduce((sum, post) => sum + post.readTimeMinutes, 0);

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "Series", path: "/series" },
    { name: series.title, path: `/series/${slug}` },
  ];
  const url = absoluteUrl(`/series/${slug}`);

  /**
   * A series is an ordered reading path, so the ItemList is explicitly
   * ascending — unlike the reverse-chronological archives.
   */
  const schemas = [
    webPageSchema({
      url,
      name: `${series.title} — ${site.name}`,
      description: series.description || `The ${series.title} series on ${site.name}.`,
      crumbs,
      type: "CollectionPage",
    }),
    {
      ...itemListSchema(series.posts, url, series.title),
      itemListOrder: "https://schema.org/ItemListOrderAscending",
    },
    breadcrumbSchema(crumbs, url),
  ];

  return (
    <div className="u-container py-12 md:py-16">
      <JsonLd schemas={schemas} />
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <Breadcrumbs crumbs={crumbs} className="mb-4" />
        <p className="u-meta mb-3">Series</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{series.title}</h1>
        {series.description && (
          <p
            className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed"
            style={{ color: "var(--fg-muted)" }}
          >
            {series.description}
          </p>
        )}
        <p className="mt-5 u-meta">
          {series.posts.length} {series.posts.length === 1 ? "part" : "parts"} · {totalMinutes} min
          total
        </p>
      </header>

      {series.posts.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--fg-muted)" }}>
          No published posts in this series yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {series.posts.map((post, index) => (
            <li key={post._id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-5 rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-strong)",
                    color: "var(--fg-muted)",
                  }}
                >
                  {post.seriesOrder ?? index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[var(--accent)]">
                    <span className="sr-only">Part {post.seriesOrder ?? index + 1}: </span>
                    {post.title}
                  </h2>
                  <p
                    className="mt-2 line-clamp-2 text-[0.925rem] leading-relaxed"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {post.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <time dateTime={toIsoDate(post.publishedAt)} className="u-meta">
                      {formatShortDate(post.publishedAt)}
                    </time>
                    <span aria-hidden="true" style={{ color: "var(--border-strong)" }}>·</span>
                    <span className="u-meta">{post.readTimeMinutes} min</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
