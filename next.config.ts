import type { NextConfig } from "next";

const securityHeaders = [
  // Block the portal from being embedded in other sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Browsers only honour this over HTTPS (Vercel always serves HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Images are small static files; serve them as-is (the on-server image
  // optimizer is not available on Hostinger shared hosting).
  images: { unoptimized: true },
  experimental: {
    // Shared hosting (Hostinger) limits child processes: build in one process.
    webpackBuildWorker: false,
    cpus: 1,
    serverActions: {
      // Uploads are validated (6 MB) in src/lib/uploads.ts. Accept larger bodies
      // so an oversized upload gets a friendly error instead of a crash page.
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
