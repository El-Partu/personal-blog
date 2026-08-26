import Link from "next/link";
import type { PostSummary } from "@blog/shared";
import { formatShortDate, slugifyTag, toIsoDate } from "@/lib/format";

/**
 * Magazine-grid card. `featured` renders the wide lead treatment used for the
 * newest post on the homepage.
 */
export default function PostCard({
  post,
  featured = false,
}: {
  post: PostSummary;
  featured?: boolean;
}) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        featured ? "md:flex-row" : ""
      }`}
      style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
    >
      <div
        className={`relative overflow-hidden ${featured ? "md:w-[46%]" : ""}`}
        style={{ background: "var(--bg-subtle)" }}
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              featured ? "md:min-h-[15rem]" : "aspect-[16/9]"
            }`}
          />
        ) : (
          <CoverFallback category={post.category} featured={featured} />
        )}
      </div>

      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:p-7" : ""}`}>
        <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link
            href={`/category/${slugifyTag(post.category)}`}
            className="u-meta relative z-10 transition-colors hover:text-[var(--accent)]"
            style={{ color: "var(--accent)" }}
          >
            {post.category}
          </Link>
          <span aria-hidden="true" style={{ color: "var(--border-strong)" }}>
            ·
          </span>
          <time dateTime={toIsoDate(post.publishedAt)} className="u-meta">
            {formatShortDate(post.publishedAt)}
          </time>
          <span aria-hidden="true" style={{ color: "var(--border-strong)" }}>
            ·
          </span>
          <span className="u-meta">{post.readTimeMinutes} min</span>
        </div>

        <h3
          className={`font-semibold leading-snug tracking-tight ${
            featured ? "text-2xl md:text-[1.7rem]" : "text-lg"
          }`}
        >
          {/* Stretched link makes the whole card clickable while keeping one accessible link. */}
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>

        <p
          className={`mt-2.5 flex-1 text-[0.925rem] leading-relaxed ${featured ? "line-clamp-4" : "line-clamp-3"}`}
          style={{ color: "var(--fg-muted)" }}
        >
          {post.excerpt}
        </p>

        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
              <li key={tag}>
                <Link
                  href={`/tags/${slugifyTag(tag)}`}
                  className="relative z-10 inline-block rounded border px-2 py-0.5 text-[0.7rem] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--fg-subtle)" }}
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/** Deterministic geometric placeholder so cards without a cover still look intentional. */
function CoverFallback({ category, featured }: { category: string; featured: boolean }) {
  const hue = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <div
      aria-hidden="true"
      className={`flex w-full items-center justify-center ${featured ? "md:h-full md:min-h-[15rem]" : "aspect-[16/9]"}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 92%) 0%, hsl(${(hue + 40) % 360} 40% 85%) 100%)`,
      }}
    >
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={`hsl(${hue} 35% 42%)`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
        <path d="m8 17-5-5 5-5M16 7l5 5-5 5" />
      </svg>
    </div>
  );
}
