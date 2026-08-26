"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="u-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-mono text-6xl font-bold" style={{ color: "var(--accent)" }}>
        500
      </p>
      <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-[0.975rem]" style={{ color: "var(--fg-muted)" }}>
        An unexpected error occurred while loading this page. If it persists, the API
        service may be unavailable.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs" style={{ color: "var(--fg-subtle)" }}>
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
