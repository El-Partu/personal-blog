import Link from "next/link";

/** Build a page list with ellipses: 1 … 4 5 6 … 12 */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("gap");
  items.push(total);

  return items;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const baseClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          aria-label="Previous page"
          className={`${baseClass} hover:border-[var(--accent)] hover:text-[var(--accent)]`}
          style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        >
          ←
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={baseClass}
          style={{ borderColor: "var(--border)", color: "var(--fg-subtle)", opacity: 0.45 }}
        >
          ←
        </span>
      )}

      {pageItems(currentPage, totalPages).map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-sm"
            style={{ color: "var(--fg-subtle)" }}
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            className={baseClass}
            style={
              item === currentPage
                ? {
                    borderColor: "var(--accent)",
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                    fontWeight: 600,
                  }
                : { borderColor: "var(--border)", color: "var(--fg-muted)" }
            }
          >
            {item}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefFor(currentPage + 1)}
          rel="next"
          aria-label="Next page"
          className={`${baseClass} hover:border-[var(--accent)] hover:text-[var(--accent)]`}
          style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        >
          →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={baseClass}
          style={{ borderColor: "var(--border)", color: "var(--fg-subtle)", opacity: 0.45 }}
        >
          →
        </span>
      )}
    </nav>
  );
}
