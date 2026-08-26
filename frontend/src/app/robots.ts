import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawler policy.
 *
 * Two distinct classes of bot are treated differently on purpose:
 *
 * 1. **Search + AI answer engines** (Googlebot, Bingbot, OAI-SearchBot,
 *    ChatGPT-User, PerplexityBot, Claude-SearchBot …) are allowed. These
 *    surface *and cite* your pages, so blocking them removes you from the
 *    fastest-growing discovery channel there is. This is the AI-search
 *    equivalent of being indexed.
 *
 * 2. **Training-corpus crawlers** (GPTBot, ClaudeBot, CCBot, Google-Extended)
 *    take content to train models without sending readers back. They are
 *    allowed here — for a study blog, being in the corpus is usually a net
 *    positive — but they are listed separately so the owner can flip a single
 *    flag to opt out. Note `Google-Extended` has **no** effect on Google Search
 *    ranking, so disallowing it is safe if you want that.
 *
 * Set `ALLOW_AI_TRAINING_CRAWLERS=false` in the environment to opt out of (2)
 * without touching (1).
 */

/** Answer/retrieval bots: these cite sources and send real traffic. */
const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
];

/** Bots that harvest text for model training rather than for answering. */
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended"];

/**
 * Never index: the admin panel, the API proxy, and search-results pages
 * (thin/duplicate content that dilutes crawl budget). Everything else is open.
 */
const DISALLOW = ["/admin", "/admin/", "/api/", "/search", "/search?"];

export default function robots(): MetadataRoute.Robots {
  const allowTraining = process.env.ALLOW_AI_TRAINING_CRAWLERS !== "false";

  const rules: MetadataRoute.Robots["rules"] = [
    { userAgent: "*", allow: "/", disallow: DISALLOW },
    // Explicit entries for the major search crawlers so the intent is
    // unambiguous even if the wildcard rule is ever tightened.
    { userAgent: ["Googlebot", "Bingbot", "DuckDuckBot"], allow: "/", disallow: DISALLOW },
    // Image crawling helps the generated OG cards surface in image search.
    { userAgent: "Googlebot-Image", allow: "/" },
    { userAgent: AI_SEARCH_BOTS, allow: "/", disallow: DISALLOW },
    allowTraining
      ? { userAgent: AI_TRAINING_BOTS, allow: "/", disallow: DISALLOW }
      : { userAgent: AI_TRAINING_BOTS, disallow: "/" },
  ];

  return {
    rules,
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
