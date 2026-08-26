import { getPost } from "@/lib/api";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/ogCard";
import { site } from "@/lib/site";

export const alt = "Article preview";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * Per-post social card. Generated on demand and cached like the page itself,
 * so every article has a unique, readable preview without anyone having to
 * design one by hand.
 */
export default async function PostOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);

  if (!post) {
    return renderOgCard({ title: site.name, meta: site.tagline, siteName: site.name });
  }

  return renderOgCard({
    eyebrow: post.category,
    title: post.title,
    meta: `${post.readTimeMinutes} min read`,
    siteName: site.name,
  });
}
