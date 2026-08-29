import Link from "next/link";
import { navigation, site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="u-container flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-[0.95rem] font-semibold">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            {site.description}
          </p>
        </div>

        <div className="flex gap-12">
          <nav aria-label="Footer">
            <p className="u-meta mb-3">Browse</p>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors hover:text-[var(--accent)]"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin"
                  className="text-sm transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="u-meta mb-3">Elsewhere</p>
            <ul className="space-y-2">
              <li>
                <a
                  href={site.author.github}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="text-sm transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--fg-muted)" }}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={site.author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="text-sm transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--fg-muted)" }}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="/rss.xml"
                  className="text-sm transition-colors hover:text-[var(--accent)]"
                  style={{ color: "var(--fg-muted)" }}
                >
                  RSS
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="u-container flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="u-meta">
            © {new Date().getFullYear()} {site.author.name}
          </p>
          <p className="u-meta">Built with Next.js, Express and MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
