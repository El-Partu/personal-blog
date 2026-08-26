import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="u-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-6xl font-bold" style={{ color: "var(--accent)" }}>
        404
      </p>
      <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
        The link may be broken, or the post might have been moved or unpublished.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
        >
          Back home
        </Link>
        <Link
          href="/blog"
          className="rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Browse articles
        </Link>
        <Link
          href="/search"
          className="rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Search
        </Link>
      </div>
    </div>
  );
}
