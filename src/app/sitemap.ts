import type { MetadataRoute } from "next";

const BASE = "https://theskilltek.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/courses", "/ai-tools", "/admissions", "/services", "/about", "/verify"].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
