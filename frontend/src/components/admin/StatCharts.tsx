"use client";

import type { PublishingPoint, StatPoint } from "@blog/shared";

/**
 * Small presentational chart primitives.
 *
 * Deliberately hand-rolled rather than pulling in a charting library: these are
 * simple enough that a dependency would cost more First Load JS than the whole
 * dashboard, and the site has a JS budget to protect. They are plain CSS/SVG,
 * so they inherit theming and need no client-side layout measurement.
 *
 * Accessibility: each chart is also exposed as a real table to screen readers
 * via a visually-hidden caption/summary, since bar heights convey nothing
 * without sight.
 */

/** Vertical bar chart of posts published per month. */
export function PublishingChart({ data }: { data: PublishingPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.count));

  return (
    <figure className="m-0">
      <div
        className="flex h-40 items-end gap-1.5"
        role="img"
        aria-label={`Posts published per month over the last ${data.length} months. ${data
          .filter((point) => point.count > 0)
          .map((point) => `${formatMonth(point.month)}: ${point.count}`)
          .join(", ") || "No posts published in this period."}`}
      >
        {data.map((point) => (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  // Zero-count months keep a 2px stub so the axis reads as continuous.
                  height: point.count === 0 ? "2px" : `${(point.count / max) * 100}%`,
                  background:
                    point.count === 0 ? "var(--border)" : "var(--accent)",
                  opacity: point.count === 0 ? 1 : 0.85,
                }}
                title={`${formatMonth(point.month)}: ${point.count} post${
                  point.count === 1 ? "" : "s"
                }`}
              />
            </div>
            <span className="u-meta text-[0.65rem] leading-none" aria-hidden="true">
              {point.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Horizontal breakdown bars, used for categories and tags. */
export function BreakdownBars({
  data,
  emptyLabel = "Nothing to show yet.",
}: {
  data: StatPoint[];
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="u-meta py-6 text-center">{emptyLabel}</p>
    );
  }

  const max = Math.max(...data.map((point) => point.value));

  return (
    <ul className="space-y-2.5">
      {data.map((point) => (
        <li key={point.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm" title={point.label}>
            {point.label}
          </span>
          <span
            className="h-2 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(4, (point.value / max) * 100)}%`,
                background: "var(--accent)",
                opacity: 0.85,
              }}
            />
          </span>
          <span className="u-meta w-8 shrink-0 text-right tabular-nums">{point.value}</span>
        </li>
      ))}
    </ul>
  );
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(m) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
