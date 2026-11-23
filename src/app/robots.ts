import type { MetadataRoute } from "next";
import { AI_BOTS } from "@/lib/blocked-bots";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI crawlers / scrapers: not allowed to read or copy any page.
      { userAgent: AI_BOTS, disallow: "/" },
      // Search engines and everyone else: public pages only.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/teacher", "/student", "/api", "/login"],
      },
    ],
    sitemap: "https://theskilltek.com/sitemap.xml",
  };
}
