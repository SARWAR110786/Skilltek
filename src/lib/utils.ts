export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(
  amount: number,
  currency = "PKR",
): string {
  const symbol =
    currency === "PKR" ? "Rs " : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * The institute works in Pakistan time. Vercel servers run in UTC, so "today"
 * must be computed in this zone or it is still yesterday between 00:00 and
 * 05:00 PKT. Stored dates are NOT changed: an attendance day is still saved
 * as midnight (server time) of the chosen calendar day, exactly as before.
 */
export const APP_TIME_ZONE = "Asia/Karachi";

const YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Start of today's Pakistan calendar day, in the same form dates are stored. */
export function todayStart(): Date {
  return parseDateInput(dateInputValue());
}

/** YYYY-MM-DD of the given instant as a Pakistan calendar date. */
export function dateInputValue(d: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return YMD.format(d);
}

export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

