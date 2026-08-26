import Link from "next/link";
import type { Series, SeriesNavigation } from "@blog/shared";

/** "Part X of N" banner plus previous/next links within a series. */
export default function SeriesNav({
  series,
  navigation,
}: {
  series: Series;
  navigation?: SeriesNavigation;
}) {
  return (
    <aside
      aria-label="Series navigation"
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
    >
      <p className="u-meta">
        {navigation
          ? `Part ${navigation.position} of ${navigation.total} · Series`
          : "Part of a series"}
      </p>

      <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
        <Link href={`/series/${series.slug}`} className="hover:text-[var(--accent)]">
          {series.title}
        </Link>
      </h2>

      {series.description && (
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {series.description}
        </p>
      )}

      {navigation && (navigation.previous || navigation.next) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {navigation.previous ? (
            <Link
              href={`/blog/${navigation.previous.slug}`}
              rel="prev"
              className="group rounded-lg border p-3 transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              <span className="u-meta">← Previous</span>
              <span className="mt-1 block text-sm font-medium leading-snug">
                {navigation.previous.title}
              </span>
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden sm:block" />
          )}

          {navigation.next && (
            <Link
              href={`/blog/${navigation.next.slug}`}
              rel="next"
              className="group rounded-lg border p-3 text-right transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              <span className="u-meta">Next →</span>
              <span className="mt-1 block text-sm font-medium leading-snug">
                {navigation.next.title}
              </span>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
