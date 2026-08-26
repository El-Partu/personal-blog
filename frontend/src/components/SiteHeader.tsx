"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { navigation, site } from "@/lib/site";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}
    >
      <div className="u-container flex h-16 items-center gap-4">
        <Link
          href="/"
          className="shrink-0 text-[0.98rem] font-semibold tracking-tight"
          onClick={() => setMenuOpen(false)}
        >
          {site.name}
          <span aria-hidden="true" style={{ color: "var(--accent)" }}>
            .
          </span>
        </Link>

        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: isActive(item.href) ? "var(--fg)" : "var(--fg-muted)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-56 lg:block">
            <Suspense fallback={null}>
              <SearchBox />
            </Suspense>
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-[var(--bg-subtle)] lg:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:bg-[var(--bg-subtle)] md:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t md:hidden"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <div className="u-container flex flex-col py-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: isActive(item.href) ? "var(--fg)" : "var(--fg-muted)" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
