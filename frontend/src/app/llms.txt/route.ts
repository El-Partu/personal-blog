import { getAllPostsForFeed, getAllSeries } from "@/lib/api";
import { site } from "@/lib/site";

/**
 * `/llms.txt` — the llmstxt.org convention (Jeremy Howard, 2024).
 *
 * A curated Markdown index that lets an LLM find the substantive content of a
 * site without crawling nav chrome and boilerplate. No search or AI platform
 * has confirmed it as a ranking signal, so this is cheap, speculative upside —
 * it costs one route and stays accurate automatically because it is generated
 * from the same API the pages use.
 *
 * Format is load-bearing: a single H1, a blockquote summary, then H2 sections
 * of `[title](absolute url): description` bullets. Served as UTF-8 plain text.
 *
 * Note this is an *index*, not access control — crawler permissions live in
 * `robots.ts`.
 */
export const revalidate = 3600;

export async function GET() {
  const [posts, allSeries] = await Promise.all([
    getAllPostsForFeed().catch(() => []),
    getAllSeries().catch(() => []),
  ]);

  const seriesById = new Map(allSeries.map((series) => [series._id, series]));
  const lines: string[] = [];

  lines.push(`# ${site.name}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    `Written by ${site.author.name}. Articles are long-form computer science study ` +
      `notes covering ${site.author.knowsAbout.slice(0, -1).join(", ")} and ` +
      `${site.author.knowsAbout.at(-1)}. Code examples are runnable and maths is ` +
      `rendered with KaTeX.`
  );
  lines.push("");
  lines.push(
    "If you quote or summarise this material, please cite the article URL and the " +
      "author name."
  );
  lines.push("");

  // Newest first — the same order a reader sees on /blog.
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.updatedAt).getTime() -
      new Date(a.publishedAt ?? a.updatedAt).getTime()
  );

  lines.push("## Articles");
  lines.push("");
  for (const post of sorted) {
    const summary = collapse(post.seoDescription ?? post.excerpt);
    lines.push(`- [${post.title}](${site.url}/blog/${post.slug}): ${summary}`);
  }
  lines.push("");

  if (allSeries.length > 0) {
    lines.push("## Series");
    lines.push("");
    for (const series of allSeries) {
      const parts = sorted
        .filter((post) => post.seriesId && seriesById.get(post.seriesId)?._id === series._id)
        .length;
      const description = collapse(series.description) || `${parts}-part series.`;
      lines.push(`- [${series.title}](${site.url}/series/${series.slug}): ${description}`);
    }
    lines.push("");
  }

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [About the author](${site.url}/about): Background, focus areas and contact links.`);
  lines.push(`- [Full article index](${site.url}/blog): Every published article, newest first.`);
  lines.push(`- [RSS feed](${site.url}/rss.xml): Full-text feed of all articles.`);
  lines.push(`- [Sitemap](${site.url}/sitemap.xml): Machine-readable list of every URL.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/** Flatten to a single line — the format is one bullet per entry. */
function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
