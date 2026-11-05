const CNIC_DIGITS = /^\d{13}$/;
const CNIC_CHARS = /^[\d\s-]+$/;
const PHONE_CHARS = /^[\d\s()-]+$/;

/**
 * Accepts a phone number containing exactly 11 digits (spaces, dashes and
 * parentheses are stripped) and returns the digits only. Returns null when
 * the number is not exactly 11 digits.
 */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_CHARS.test(trimmed)) return null;

  const digits = trimmed.replace(/\D/g, "");
  return /^\d{11}$/.test(digits) ? digits : null;
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) !== null;
}

/**
 * Accepts a 13-digit CNIC (digits, spaces or dashes) and returns the standard
 * XXXXX-XXXXXXX-X form. Returns null when invalid.
 */
export function normalizeCnic(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !CNIC_CHARS.test(trimmed)) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (!CNIC_DIGITS.test(digits)) return null;

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isValidCnic(value: string): boolean {
  return normalizeCnic(value) !== null;
}

export const PHONE_PATTERN = "^\\d{11}$";
export const CNIC_PATTERN = "^\\d{5}-\\d{7}-\\d$";
export const PHONE_HINT = "11-digit phone number, e.g. 0300-1234567";
export const CNIC_HINT = "13-digit CNIC, e.g. 41409-1234567-1";
