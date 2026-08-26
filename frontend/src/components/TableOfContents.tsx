"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@blog/shared";

/**
 * Sticky table of contents with scroll-spy. Only rendered for posts with
 * enough headings to be worth it (see the article page).
 */
export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) return;

    // Highlight the heading nearest the top of the viewport, biased downward
    // so a heading counts as "current" while its section is being read.
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
          return;
        }
        // Nothing intersecting: fall back to the last heading above the fold.
        const above = headings.filter((h) => h.getBoundingClientRect().top < 120);
        const last = above[above.length - 1];
        if (last) setActiveId(last.id);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: [0, 1] }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading" className="text-sm">
      <p id="toc-heading" className="u-meta mb-3">
        On this page
      </p>
      <ul className="space-y-1 border-l" style={{ borderColor: "var(--border)" }}>
        {entries.map((entry) => {
          const isActive = activeId === entry.id;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? "location" : undefined}
                className="block border-l-2 py-1 leading-snug transition-colors hover:text-[var(--fg)]"
                style={{
                  marginLeft: "-1px",
                  paddingLeft: entry.depth === 3 ? "1.5rem" : "0.75rem",
                  borderColor: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--fg)" : "var(--fg-muted)",
                  fontWeight: isActive ? 550 : 400,
                }}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
