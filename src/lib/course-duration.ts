// Pure helpers (no server code) so the course form can show the same
// duration that the server saves.

const DAY = 86400000;

function utcDay(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(t) ? t : null;
}

/** Days from start to end, both counted. null if either is missing/invalid or end < start. */
export function courseDays(start: string, end: string): number | null {
  const a = utcDay(start);
  const b = utcDay(end);
  if (a == null || b == null || b < a) return null;
  return Math.round((b - a) / DAY) + 1;
}

/**
 * Whole months the course runs, rounded to the nearest month (at least 1):
 * 1 Dec – 31 May = 6, 1 Jan – 31 Mar = 3, 15 Jan – 14 Feb = 1.
 */
export function courseMonths(start: string, end: string): number | null {
  const days = courseDays(start, end);
  if (days == null) return null;
  return Math.max(1, Math.round(days / 30.4375));
}

export const MAX_COURSE_MONTHS = 60;
