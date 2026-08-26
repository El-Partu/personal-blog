/**
 * Site-wide configuration.
 *
 * TODO (site owner): replace the placeholder values below with your own
 * details — they appear in metadata, the RSS feed, the footer and the About
 * page. Everything marked PLACEHOLDER is safe to edit freely.
 *
 * SEO note: the author fields are not cosmetic. `jobTitle`, `alumniOf`,
 * `knowsAbout` and `sameAs` are emitted as `Person` structured data and are
 * how search engines connect this byline to a real, credentialed identity
 * (E-E-A-T). Filling them in properly is one of the highest-value edits you
 * can make to this file — a generic/anonymous byline is a known liability.
 */
export const site = {
  name: "Compiled Thoughts", // PLACEHOLDER — your blog name
  tagline: "Computer science notes, written to be understood",
  description:
    "Study notes and deep dives on algorithms, operating systems, databases and " +
    "systems programming — written up as I learn them.",
  /** Used for canonical URLs, OG tags, RSS and the sitemap. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** BCP-47 tag used in `inLanguage` structured data and `<html lang>`. */
  language: "en-GB",
  author: {
    name: "Your Name", // PLACEHOLDER
    /** Shown on the About page when the API has no bio saved. */
    fallbackBio:
      "I'm a computer science student writing up what I learn. These notes cover " +
      "algorithms, systems, databases and whatever coursework I'm currently buried in.",
    github: "https://github.com/El-Partu", // PLACEHOLDER
    linkedin: "https://linkedin.com/in/your-handle", // PLACEHOLDER
    email: "you@example.com", // PLACEHOLDER
    /** PLACEHOLDER — shown on the About page and emitted as `Person.jobTitle`. */
    jobTitle: "Computer Science Student",
    /** PLACEHOLDER — set to your university, or "" to omit it from schema. */
    alumniOf: "",
    /**
     * Topics you can credibly claim expertise in. Emitted as `knowsAbout`,
     * which is how a crawler decides what subjects your byline is authoritative
     * on. Keep it honest and specific.
     */
    knowsAbout: [
      "Algorithms",
      "Data Structures",
      "Operating Systems",
      "Databases",
      "Systems Programming",
      "Computer Science",
    ],
    /**
     * Extra profile URLs for entity reconciliation (`sameAs`) — e.g. Mastodon,
     * X, Stack Overflow, ORCID, a personal domain. Add as many as are real.
     */
    sameAs: [] as string[],
  },
  locale: "en_GB",
  /** Posts per page on listing pages. */
  pageSize: 9,
} as const;

export const navigation = [
  { href: "/blog", label: "Articles" },
  { href: "/series", label: "Series" },
  { href: "/tags", label: "Topics" },
  { href: "/about", label: "About" },
] as const;
