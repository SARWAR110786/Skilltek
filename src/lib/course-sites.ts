/** Courses that have their own website (matched by course title). */
const COURSE_SITES: { match: RegExp; url: string; label: string }[] = [
  { match: /agentic\s*ai/i, url: "https://agenticai.theskilltek.com", label: "agenticai.theskilltek.com" },
];

export function courseWebsite(title: string): { url: string; label: string } | null {
  const hit = COURSE_SITES.find((s) => s.match.test(title));
  return hit ? { url: hit.url, label: hit.label } : null;
}
