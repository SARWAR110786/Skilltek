import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Portals and APIs are private and should not appear in search results.
        disallow: ["/admin", "/teacher", "/student", "/api", "/login"],
      },
    ],
    sitemap: "https://theskilltek.com/sitemap.xml",
  };
}
