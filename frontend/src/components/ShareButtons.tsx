"use client";

import { useState } from "react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable (insecure context) */
    }
  };

  const linkClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]";

  return (
    <div className="flex items-center gap-2">
      <span className="u-meta mr-1">Share</span>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        title="Share on X"
        className={linkClass}
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.2-6.7L5.5 22H2.4l7.6-8.7L1.2 2h6.8l4.7 6.2L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
        </svg>
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
        className={linkClass}
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.65 4.76 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
        </svg>
      </a>

      <a
        href={`https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Hacker News"
        title="Share on Hacker News"
        className={linkClass}
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M2 2h20v20H2V2Zm10.5 11.4L16.8 6h-1.9l-2.7 5.1c-.1.2-.2.4-.2.6-.1-.2-.1-.4-.2-.6L9.1 6H7.1l4.3 7.4V18h1.1v-4.6Z" />
        </svg>
      </a>

      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Copied!" : "Copy link"}
        className={linkClass}
        style={{
          borderColor: copied ? "var(--accent)" : "var(--border)",
          color: copied ? "var(--accent)" : "var(--fg-muted)",
        }}
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
          </svg>
        )}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
