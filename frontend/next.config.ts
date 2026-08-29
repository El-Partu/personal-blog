import type { NextConfig } from "next";

/**
 * The browser must never call the API host directly (it may be private, and it
 * avoids CORS entirely in development). All `/api/*` requests are proxied from
 * Next.js to the Express service using a server-side env var.
 */
const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy for every page.
 *
 * - Next.js embeds the RSC payload as inline <script> blocks, so
 *   `script-src 'unsafe-inline'` is required; `unsafe-eval` is dev-only (HMR).
 * - Tailwind/KaTeX CSS and inline `style` props need `style-src 'unsafe-inline'`.
 * - `img-src` mirrors the `images.remotePatterns` below plus the `/uploads` proxy.
 * - `frame-ancestors 'self'` stops the site (and the admin login) from being
 *   clickjack-embedded by third parties.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.amazonaws.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        // Backed by CSP frame-ancestors for modern browsers; this covers legacy ones.
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ]),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Allow the sandbox/preview host to request `/_next/*` dev assets.
   *
   * When the dev server is viewed through a proxied hostname (Codespaces,
   * e2b, ngrok, a LAN IP…) rather than localhost, Next warns about the
   * cross-origin request today and will block it in a future major version,
   * which breaks HMR and can leave the preview unstyled. Dev-only setting —
   * it has no effect on `next build`/`next start`.
   */
  allowedDevOrigins: ["*.e2b.app", "*.github.dev", "*.gitpod.io", "*.ngrok-free.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
