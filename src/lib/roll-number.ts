export const ROLL_PREFIX = "SK";

/** Two-digit year, e.g. 26 — used as SK-26-001-01. */
export function rollYear(date: Date = new Date()): string {
  return String(date.getFullYear()).slice(-2);
}

/** Numeric course codes are always three digits (32 -> 032, 7 -> 007). */
export function normalizeRollCourseCode(code: string): string {
  const value = String(code ?? "").trim().toUpperCase();
  if (/^\d+$/.test(value)) return value.padStart(3, "0");
  return value || "GEN";
}

export function rollPrefix(year: string, code: string): string {
  return `${ROLL_PREFIX}-${year}-${normalizeRollCourseCode(code)}-`;
}

export function formatRollNo(
  year: string,
  code: string,
  serial: number,
): string {
  return `${rollPrefix(year, code)}${String(serial).padStart(2, "0")}`;
}

export function parseRollSerial(rollNo: string, prefix: string): number {
  if (!rollNo.startsWith(prefix)) return 0;
  const serial = Number.parseInt(rollNo.slice(prefix.length), 10);
  return Number.isFinite(serial) ? serial : 0;
}
