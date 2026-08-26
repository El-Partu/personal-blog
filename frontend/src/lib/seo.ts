/**
 * Structured-data + SEO helpers.
 *
 * Design notes (these follow Google's current guidance, and the reasoning is
 * worth keeping because it is easy to accidentally undo):
 *
 * 1. JSON-LD only. Google explicitly prefers it over Microdata/RDFa.
 * 2. Every node gets a **stable `@id`**, and pages reference shared entities by
 *    `@id` instead of copy-pasting them. That is what lets a crawler collapse
 *    "the author of this post", "the person on the About page" and "the founder
 *    of the site" into one entity — the single biggest structured-data win for
 *    E-E-A-T, and the thing most blogs get wrong.
 * 3. Unrelated schema types go in **separate `<script>` tags** (see `JsonLd`),
 *    never merged into one object.
 * 4. Markup must describe what is actually on the page. `BreadcrumbList` is
 *    emitted by the same component that renders the visible breadcrumb trail,
 *    so the two cannot drift apart.
 *
 * Structured data does not directly raise rankings — it buys eligibility for
 * rich results and gives AI/answer engines an unambiguous parse of the page.
 */
import { site } from "./site";

/* ------------------------------------------------------------------ *
 * Stable entity identifiers
 * ------------------------------------------------------------------ */

/** Canonical `@id`s for the site-wide entities. Never change these casually. */
export const ID = {
  organization: `${site.url}/#organization`,
  website: `${site.url}/#website`,
  person: `${site.url}/about#person`,
  logo: `${site.url}/#logo`,
} as const;

/** Resolve a site-relative path to an absolute URL. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ------------------------------------------------------------------ *
 * Site-wide entities
 * ------------------------------------------------------------------ */

/**
 * The publisher. A personal blog is legitimately a one-person operation, so
 * the Organization and the Person are linked (`founder` / `worksFor`) rather
 * than pretending to be a company.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ID.organization,
    name: site.name,
    url: site.url,
    description: site.description,
    logo: {
      "@type": "ImageObject",
      "@id": ID.logo,
      url: absoluteUrl("/icon.png"),
      width: 512,
      height: 512,
      caption: site.name,
    },
    image: { "@id": ID.logo },
    founder: { "@id": ID.person },
    sameAs: authorSameAs(),
  };
}

/**
 * The website itself, plus the `SearchAction` that makes a sitelinks search
 * box possible. `/search?q=` must be a real, working, indexable-by-crawl route
 * or this is a lie — it is (`app/search/page.tsx`).
 */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID.website,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": ID.organization },
    copyrightHolder: { "@id": ID.person },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Social / profile URLs used for entity reconciliation (`sameAs`). */
function authorSameAs(): string[] {
  return [site.author.github, site.author.linkedin, ...site.author.sameAs].filter(
    (url): url is string => Boolean(url) && !url.includes("your-handle")
  );
}

/**
 * The author entity. `knowsAbout` / `jobTitle` / `alumniOf` are the machine-
 * readable half of E-E-A-T: they tell a crawler *what this person is
 * qualified to talk about*, which is exactly what recent core updates
 * re-weighted toward.
 */
export function personSchema(overrides?: { name?: string; description?: string }) {
  const sameAs = authorSameAs();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ID.person,
    name: overrides?.name ?? site.author.name,
    url: absoluteUrl("/about"),
    description: overrides?.description ?? site.author.fallbackBio,
    ...(site.author.jobTitle ? { jobTitle: site.author.jobTitle } : {}),
    ...(site.author.alumniOf
      ? { alumniOf: { "@type": "EducationalOrganization", name: site.author.alumniOf } }
      : {}),
    knowsAbout: [...site.author.knowsAbout],
    ...(sameAs.length > 0 ? { sameAs } : {}),
    worksFor: { "@id": ID.organization },
    mainEntityOfPage: { "@id": `${site.url}/about#webpage` },
  };
}

/* ------------------------------------------------------------------ *
 * Per-page entities
 * ------------------------------------------------------------------ */

export type Crumb = { name: string; path: string };

/**
 * `BreadcrumbList` — the highest-value/lowest-effort structured data there is,
 * because Google replaces the raw URL in the SERP with the trail.
 * The final crumb is the current page and is intentionally still given an
 * `item`, which Google accepts and which keeps the list self-describing.
 */
export function breadcrumbSchema(crumbs: Crumb[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

type ArticleInput = {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  publishedAt?: string;
  updatedAt: string;
  readTimeMinutes: number;
  authorName: string;
  authorBio?: string;
};

/**
 * `BlogPosting` (not `Article`/`NewsArticle` — this is editorial, non-news).
 *
 * `wordCount`, `articleSection`, `timeRequired` and `keywords` are not
 * required by Google, but they are strong depth/topicality signals for AI
 * answer engines, which increasingly quote long-form technical explainers.
 */
export function blogPostingSchema(post: ArticleInput) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const published = toIso(post.publishedAt ?? post.updatedAt);
  const modified = toIso(post.updatedAt);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    isPartOf: { "@id": ID.website },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    // Google truncates headlines past ~110 characters.
    headline: truncate(post.title, 110),
    name: post.title,
    description: post.description,
    url,
    datePublished: published,
    dateModified: modified,
    author: { "@id": ID.person },
    creator: { "@id": ID.person },
    publisher: { "@id": ID.organization },
    copyrightHolder: { "@id": ID.person },
    copyrightYear: Number(published.slice(0, 4)) || undefined,
    inLanguage: site.language,
    isAccessibleForFree: true,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    about: post.tags.map((tag) => ({ "@type": "Thing", name: tag })),
    wordCount: countWords(post.content),
    timeRequired: `PT${Math.max(1, post.readTimeMinutes)}M`,
    // Falls back to this post's own generated OG card, not the site-wide one.
    image: imageObject(post.coverImage, post.title, ogImageUrl(`/blog/${post.slug}`)),
    thumbnailUrl: post.coverImage ? absoluteUrl(post.coverImage) : ogImageUrl(`/blog/${post.slug}`),
    /**
     * Tells voice assistants / AI readers which parts are worth reading aloud.
     * Both selectors exist on the rendered post page.
     */
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".post-summary"],
    },
  };
}

/** `WebPage` node — the thing breadcrumbs and articles hang off. */
export function webPageSchema(options: {
  url: string;
  name: string;
  description: string;
  crumbs?: Crumb[];
  datePublished?: string;
  dateModified?: string;
  type?: "WebPage" | "CollectionPage" | "AboutPage" | "ProfilePage" | "SearchResultsPage";
  primaryImage?: string;
}) {
  const {
    url,
    name,
    description,
    crumbs,
    datePublished,
    dateModified,
    type = "WebPage",
    primaryImage,
  } = options;

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": ID.website },
    about: { "@id": ID.organization },
    inLanguage: site.language,
    ...(crumbs && crumbs.length > 1 ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(datePublished ? { datePublished: toIso(datePublished) } : {}),
    ...(dateModified ? { dateModified: toIso(dateModified) } : {}),
    ...(primaryImage
      ? { primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(primaryImage) } }
      : {}),
  };
}

/**
 * `ItemList` for archive pages. Listing the actual posts in order gives
 * crawlers (and AI retrievers) a clean map of the collection without having to
 * infer it from the DOM.
 */
export function itemListSchema(
  items: { title: string; slug: string }[],
  pageUrl: string,
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#itemlist`,
    name: listName,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: absoluteUrl(`/blog/${item.slug}`),
    })),
  };
}

/** `Blog` node for the main archive, tying the post list to the publisher. */
export function blogSchema(posts: { title: string; slug: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${site.url}/blog#blog`,
    url: absoluteUrl("/blog"),
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": ID.organization },
    author: { "@id": ID.person },
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
      headline: truncate(post.title, 110),
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** URL of the generated OG card for a route (see the `opengraph-image` files). */
export function ogImageUrl(path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return absoluteUrl(`${clean}/opengraph-image`);
}

/** Google wants an ImageObject with real dimensions, and prefers 16:9. */
function imageObject(coverImage: string | undefined, caption: string, fallback = ogImageUrl()) {
  if (coverImage) {
    return {
      "@type": "ImageObject",
      url: absoluteUrl(coverImage),
      caption,
    };
  }
  // Generated cards are always exactly 1200x630, so the dimensions are known.
  return {
    "@type": "ImageObject",
    url: fallback,
    width: 1200,
    height: 630,
    caption,
  };
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

function toIso(value: string | Date | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Word count over the Markdown source, with code fences and syntax stripped. */
export function countWords(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ");
  const words = prose.match(/\b[\p{L}\p{N}'-]+\b/gu);
  return words ? words.length : 0;
}
