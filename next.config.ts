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
      // Assignment uploads are capped at 4 MB in src/lib/uploads.ts; leave a
      // little headroom for the other form fields. Vercel's hard cap is 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
