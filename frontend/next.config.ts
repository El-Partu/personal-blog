import type { NextConfig } from "next";

/**
 * The browser must never call the API host directly (it may be private, and it
 * avoids CORS entirely in development). All `/api/*` requests are proxied from
 * Next.js to the Express service using a server-side env var.
 */
const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
