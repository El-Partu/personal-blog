import Link from "next/link";
import type { Metadata } from "next";
import { getAllSeries, getAuthor, getPosts } from "@/lib/api";
import { site } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import {
  absoluteUrl,
  breadcrumbSchema,
  organizationSchema,
  personSchema,
  webPageSchema,
  type Crumb,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: `About ${site.author.name}`,
  description:
    `${site.author.name} writes ${site.name} — long-form computer science study notes on ` +
    `${site.author.knowsAbout.slice(0, 3).join(", ")} and more.`,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    url: absoluteUrl("/about"),
    title: `About ${site.author.name}`,
    siteName: site.name,
  },
};

export const revalidate = 300;

export default async function AboutPage() {
  const [author, posts, series] = await Promise.all([
    getAuthor().catch(() => null),
    getPosts({ limit: 1 }).catch(() => null),
    getAllSeries().catch(() => []),
  ]);

  const name = author?.name ?? site.author.name;
  const bio = author?.bio?.trim() || site.author.fallbackBio;

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];
  const url = absoluteUrl("/about");

  /**
   * The author entity lives here, at the `@id` every article's `author` field
   * points to. Credentials (`jobTitle`, `alumniOf`, `knowsAbout`) and verified
   * profiles (`sameAs`) are the machine-readable side of E-E-A-T.
   */
  const schemas = [
    webPageSchema({
      url,
      name: `About ${name}`,
      description: bio,
      crumbs,
      type: "ProfilePage",
    }),
    { ...personSchema({ name, description: bio }), mainEntityOfPage: { "@id": `${url}#webpage` } },
    organizationSchema(),
    breadcrumbSchema(crumbs, url),
  ];

  return (
    <>
      <JsonLd schemas={schemas} />

      <div className="u-container py-12 md:py-16">
        <div className="mx-auto max-w-[68ch]">
          <Breadcrumbs crumbs={crumbs} className="mb-6" />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Hi, I&apos;m {name}.
          </h1>

          <div className="prose-article mt-8">
            <p>{bio}</p>

            <p>
              This site is where I write up what I&apos;m studying. The act of explaining
              something clearly is the fastest way I know to find the gaps in my own
              understanding — so these posts exist mainly to force me to actually
              understand the material rather than just recognise it.
            </p>

            <h2>What you&apos;ll find here</h2>
            <p>
              Long-form notes on algorithms and complexity, operating systems, databases and
              systems programming. Posts lean heavily on code and worked examples, and the
              bigger topics are grouped into{" "}
              <Link href="/series">series</Link> you can read in order.
            </p>

            <h2>Get in touch</h2>
            <p>
              If something here is wrong, unclear, or could be explained better, I genuinely
              want to know — corrections are welcome.
            </p>
          </div>

          {/* Stats */}
          <dl
            className="mt-10 grid grid-cols-2 gap-4 border-y py-6 sm:grid-cols-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <dt className="u-meta">Articles</dt>
              <dd className="mt-1 text-2xl font-semibold">{posts?.total ?? "—"}</dd>
            </div>
            <div>
              <dt className="u-meta">Series</dt>
              <dd className="mt-1 text-2xl font-semibold">{series.length}</dd>
            </div>
            <div>
              <dt className="u-meta">Currently</dt>
              <dd className="mt-1 text-2xl font-semibold">Studying CS</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={site.author.github}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2A10 10 0 0 0 8.8 21.5c.5.1.7-.2.7-.5v-1.7C6.7 19.9 6.1 18 6.1 18c-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
              </svg>
              GitHub
            </a>
            <a
              href={site.author.linkedin}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.65 4.76 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
              </svg>
              LinkedIn
            </a>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              RSS
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
