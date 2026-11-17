/** Course codes are sequential 3-digit numbers: 001, 002, … */
export function nextNumericCourseCode(
  existingCodes: (string | null | undefined)[],
): string {
  const used = new Set(
    existingCodes.map((code) => String(code ?? "").trim()),
  );
  let next = 1;
  while (used.has(String(next).padStart(3, "0"))) next += 1;
  return String(next).padStart(3, "0");
}
