import type { NextConfig } from "next";

/**
 * The browser must never call the API host directly (it may be private, and it
 * avoids CORS entirely in development). All `/api/*` requests are proxied from
 * Next.js to the Express service using a server-side env var.
 */
const apiOrigin = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
