import Link from "next/link";
import type { Metadata } from "next";
import { getAllSeries } from "@/lib/api";

export const metadata: Metadata = {
  title: "Series",
  description: "Multi-part deep dives, grouped into series and ordered for reading.",
  alternates: { canonical: "/series" },
};

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const allSeries = await getAllSeries().catch(() => []);

  return (
    <div className="u-container py-12 md:py-16">
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--border)" }}>
        <p className="u-meta mb-3">Collections</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Series</h1>
        <p className="mt-3 max-w-xl text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
          Some topics are too big for one post. These are the multi-part write-ups, in
          reading order.
        </p>
      </header>

      {allSeries.length === 0 ? (
        <p className="py-16 text-center" style={{ color: "var(--fg-muted)" }}>
          No series yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {allSeries.map((series) => (
            <Link
              key={series._id}
              href={`/series/${series.slug}`}
              className="group flex flex-col rounded-xl border p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-lg"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              <span className="u-meta">
                {series.postCount} {series.postCount === 1 ? "part" : "parts"}
              </span>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{series.title}</h2>
              <p
                className="mt-2.5 flex-1 text-[0.925rem] leading-relaxed"
                style={{ color: "var(--fg-muted)" }}
              >
                {series.description}
              </p>
              <span
                className="mt-5 text-sm font-medium transition-colors group-hover:text-[var(--accent)]"
                style={{ color: "var(--fg-muted)" }}
              >
                Read the series →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
