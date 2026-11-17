import { prisma } from "@/lib/prisma";

/** Roll numbers look like SK-26-001-05; allow letters, digits and dashes only. */
const ROLL_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+){1,5}$/;

export function normalizeRollInput(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

export function isValidRollFormat(roll: string): boolean {
  return roll.length >= 4 && roll.length <= 40 && ROLL_RE.test(roll);
}

export type VerifiedCertificate = {
  rollNo: string;
  name: string;
  course: string | null;
  courseCode: string | null;
  durationMonths: number | null;
  admissionDate: Date;
};

/**
 * Public, read-only lookup for certificate verification.
 *
 * Only students marked PASSOUT are ever returned. Active, inactive and
 * dropout students produce the same "not found" result, so the page can't be
 * used to discover who studies here. Only the fields printed on a certificate
 * are selected — never email, phone, CNIC, guardian or address.
 */
export async function findPassoutCertificate(
  rollNo: string,
): Promise<VerifiedCertificate | null> {
  const student = await prisma.student.findUnique({
    where: { admissionNo: rollNo },
    select: {
      admissionNo: true,
      exitReason: true,
      admissionDate: true,
      user: { select: { name: true } },
      course: { select: { title: true, code: true, durationMonths: true } },
    },
  });
  if (!student || student.exitReason !== "PASSOUT") return null;
  return {
    rollNo: student.admissionNo,
    name: student.user.name,
    course: student.course?.title ?? null,
    courseCode: student.course?.code ?? null,
    durationMonths: student.course?.durationMonths ?? null,
    admissionDate: student.admissionDate,
  };
}
