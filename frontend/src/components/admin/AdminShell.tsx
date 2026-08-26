"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminUser } from "@blog/shared";
import { fetchMe, getToken, logout } from "@/lib/adminClient";
import ThemeToggle from "@/components/ThemeToggle";
import { site } from "@/lib/site";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/series", label: "Series" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/profile", label: "Profile" },
];

/**
 * Client-side auth guard and chrome for every admin page.
 *
 * Note this is a UX guard, not a security boundary — the API independently
 * rejects any unauthenticated request, so a forged client cannot read or
 * write anything.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    fetchMe()
      .then((me) => {
        setUser(me);
        setChecking(false);
      })
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [router]);

  const onLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="u-meta">Loading…</p>
      </div>
    );
  }

  const isActive = (link: (typeof links)[number]) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg) 90%, transparent)",
        }}
      >
        <div className="u-container flex h-14 items-center gap-4">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            {site.name}
            <span className="u-meta ml-2">admin</span>
          </Link>

          <nav aria-label="Admin" className="ml-4 hidden items-center gap-0.5 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link) ? "page" : undefined}
                className="rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: isActive(link) ? "var(--fg)" : "var(--fg-muted)" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden text-sm transition-colors hover:text-[var(--accent)] sm:block"
              style={{ color: "var(--fg-muted)" }}
            >
              View site ↗
            </Link>
            <ThemeToggle />
            <button type="button" onClick={onLogout} className="btn btn-secondary">
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          aria-label="Admin mobile"
          className="border-t md:hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="u-container flex gap-1 overflow-x-auto py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link) ? "page" : undefined}
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm"
                style={{
                  color: isActive(link) ? "var(--fg)" : "var(--fg-muted)",
                  background: isActive(link) ? "var(--bg-subtle)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="u-container py-8">
        {user && (
          <p className="sr-only" aria-live="polite">
            Signed in as {user.name}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
