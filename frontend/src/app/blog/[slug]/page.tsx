import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPostsForFeed, getPost, getRelatedPosts } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, slugifyTag, toIsoDate } from "@/lib/format";
import { site } from "@/lib/site";
import TableOfContents from "@/components/TableOfContents";
import ShareButtons from "@/components/ShareButtons";
import SeriesNav from "@/components/SeriesNav";
import PostCard from "@/components/PostCard";
import ViewCounter from "@/components/ViewCounter";

export const revalidate = 60;

/** Pre-render every published post at build time (ISR keeps them fresh). */
export async function generateStaticParams() {
  try {
    const posts = await getAllPostsForFeed();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    // API unavailable at build time — pages render on demand instead.
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);

  if (!post) return { title: "Post not found" };

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  const url = `${site.url}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: site.name,
      publishedTime: toIsoDate(post.publishedAt),
      modifiedTime: toIsoDate(post.updatedAt),
      authors: [site.author.name],
      tags: post.tags,
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);

  if (!post) notFound();

  const [{ html, toc }, related] = await Promise.all([
    renderMarkdown(post.content),
    getRelatedPosts(slug).catch(() => []),
  ]);

  const url = `${site.url}/blog/${post.slug}`;
  const showToc = toc.length >= 3;

  // JSON-LD Article schema for rich results (Section 5, SEO).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    datePublished: toIsoDate(post.publishedAt),
    dateModified: toIsoDate(post.updatedAt),
    author: {
      "@type": "Person",
      name: site.author.name,
      url: site.author.github,
    },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter slug={post.slug} />

      <article className="u-container py-10 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-7">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="u-meta hover:text-[var(--accent)]">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="u-meta">
              /
            </li>
            <li>
              <Link href="/blog" className="u-meta hover:text-[var(--accent)]">
                Articles
              </Link>
            </li>
            <li aria-hidden="true" className="u-meta">
              /
            </li>
            <li>
              <Link
                href={`/category/${slugifyTag(post.category)}`}
                className="u-meta hover:text-[var(--accent)]"
              >
                {post.category}
              </Link>
            </li>
          </ol>
        </nav>

        <header className="mx-auto max-w-[68ch]">
          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight md:text-[2.75rem]">
            {post.title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            {post.excerpt}
          </p>

          <div
            className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y py-3.5"
            style={{ borderColor: "var(--border)" }}
          >
            <time dateTime={toIsoDate(post.publishedAt)} className="u-meta">
              {formatDate(post.publishedAt)}
            </time>
            <span aria-hidden="true" style={{ color: "var(--border-strong)" }}>·</span>
            <span className="u-meta">{post.readTimeMinutes} min read</span>
            <span aria-hidden="true" style={{ color: "var(--border-strong)" }}>·</span>
            <span className="u-meta">{post.viewCount.toLocaleString("en-GB")} views</span>
            <div className="ml-auto">
              <ShareButtons title={post.title} url={url} />
            </div>
          </div>

          {post.updatedAt !== post.publishedAt && (
            <p className="mt-3 u-meta">Updated {formatDate(post.updatedAt)}</p>
          )}
        </header>

        {post.coverImage && (
          <figure className="mx-auto mt-9 max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-xl border"
              style={{ borderColor: "var(--border)" }}
            />
          </figure>
        )}

        {/* Body + sticky TOC */}
        <div
          className={`mt-10 ${showToc ? "lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12" : ""}`}
        >
          <div className={showToc ? "" : "mx-auto"}>
            {post.series && (
              <div className="mb-9 max-w-[68ch]">
                <SeriesNav series={post.series} navigation={post.seriesNavigation} />
              </div>
            )}

            <div
              className={`prose-article ${showToc ? "" : "mx-auto"}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div
                className="mt-12 max-w-[68ch] border-t pt-6"
                style={{ borderColor: "var(--border)" }}
              >
                <h2 className="u-meta mb-3">Tagged</h2>
                <ul className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/tags/${slugifyTag(tag)}`}
                        className="inline-block rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="mt-8 flex max-w-[68ch] flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
            >
              <div>
                <p className="text-sm font-medium">Found this useful?</p>
                <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                  Share it with someone studying the same thing.
                </p>
              </div>
              <ShareButtons title={post.title} url={url} />
            </div>
          </div>

          {showToc && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
                <TableOfContents entries={toc} />
              </div>
            </aside>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="mt-20 border-t pt-12"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 id="related-heading" className="text-xl font-semibold tracking-tight">
              Related reading
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item._id} post={item} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
