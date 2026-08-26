"use client";

import { useEffect } from "react";

/**
 * Registers one view per post per session. Fire-and-forget: a failure here
 * must never affect the reading experience.
 */
export default function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable — still count the view */
    }

    // Relative URL: Next.js rewrites /api/* to the backend service.
    void fetch(`/api/v1/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
