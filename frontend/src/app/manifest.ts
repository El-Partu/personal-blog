import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Web app manifest. Not a ranking factor on its own, but it is part of the
 * "installable, mobile-ready site" baseline Lighthouse checks, and it gives
 * Android/Chrome a proper icon and theme colour instead of a screenshot.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0e1014",
    theme_color: "#0e1014",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
