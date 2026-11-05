export const ROLL_PREFIX = "SK";

export function rollYear(date: Date = new Date()): string {
  return `2K${String(date.getFullYear()).slice(-2)}`;
}

export function normalizeCourseCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
}

export function courseCodeFromTitle(title: string): string {
  const words = title
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "GEN";
  if (words.length === 1) return words[0].slice(0, 4);

  const initials = words.map((word) => word[0]).join("");
  return initials.slice(0, 4) || "GEN";
}

export function rollPrefix(year: string, code: string): string {
  return `${ROLL_PREFIX}-${year}-${code}-`;
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
