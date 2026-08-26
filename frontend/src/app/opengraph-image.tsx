import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/ogCard";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Default social card, inherited by any route without its own image. */
export default function OpengraphImage() {
  return renderOgCard({
    eyebrow: "Computer science notes",
    title: site.tagline,
    meta: new URL(site.url).host,
    siteName: site.name,
  });
}
