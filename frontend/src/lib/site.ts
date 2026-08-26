/**
 * Site-wide configuration.
 *
 * TODO (site owner): replace the placeholder values below with your own
 * details — they appear in metadata, the RSS feed, the footer and the About
 * page. Everything marked PLACEHOLDER is safe to edit freely.
 */
export const site = {
  name: "Compiled Thoughts", // PLACEHOLDER — your blog name
  tagline: "Computer science notes, written to be understood",
  description:
    "Study notes and deep dives on algorithms, operating systems, databases and " +
    "systems programming — written up as I learn them.",
  /** Used for canonical URLs, OG tags, RSS and the sitemap. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: {
    name: "Your Name", // PLACEHOLDER
    /** Shown on the About page when the API has no bio saved. */
    fallbackBio:
      "I'm a computer science student writing up what I learn. These notes cover " +
      "algorithms, systems, databases and whatever coursework I'm currently buried in.",
    github: "https://github.com/El-Partu", // PLACEHOLDER
    linkedin: "https://linkedin.com/in/your-handle", // PLACEHOLDER
    email: "you@example.com", // PLACEHOLDER
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
