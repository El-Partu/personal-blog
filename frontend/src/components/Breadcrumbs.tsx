import Link from "next/link";
import type { Crumb } from "@/lib/seo";

/**
 * Visible breadcrumb trail. Always render this alongside
 * `breadcrumbSchema(crumbs, url)` built from the *same* array — Google requires
 * structured data to match on-page content, and pairing them at the call site
 * is what stops the two from drifting apart.
 *
 * The last crumb is the current page: it is not a link and carries
 * `aria-current="page"`. Separators are decorative and hidden from
 * screen readers.
 */
export default function Breadcrumbs({
  crumbs,
  className = "",
}: {
  crumbs: Crumb[];
  className?: string;
}) {
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span className="u-meta" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className="u-meta hover:text-[var(--accent)]">
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className="u-meta">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
