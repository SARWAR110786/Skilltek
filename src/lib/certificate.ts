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

export type VerifyStatus = "ACTIVE" | "INACTIVE" | "DROPOUT" | "PASSOUT";

export type VerifiedStudent = {
  rollNo: string;
  name: string;
  status: VerifyStatus;
  course: string | null;
  courseCode: string | null;
  durationMonths: number | null;
  admissionDate: Date;
};

/**
 * Public, read-only lookup by roll number for any student (Active, Inactive,
 * Dropout or Passout). Only the fields needed to confirm identity and status
 * are selected; email, phone, CNIC, guardian and address are never read.
 */
export async function findStudentByRoll(
  rollNo: string,
): Promise<VerifiedStudent | null> {
  const student = await prisma.student.findUnique({
    where: { admissionNo: rollNo },
    select: {
      admissionNo: true,
      exitReason: true,
      admissionDate: true,
      user: { select: { name: true, status: true } },
      course: { select: { title: true, code: true, durationMonths: true } },
    },
  });
  if (!student) return null;
  // Same rules as studentStatusLabel(): an exit reason wins, then the
  // temporary login block, otherwise active.
  const status: VerifyStatus =
    student.exitReason === "PASSOUT"
      ? "PASSOUT"
      : student.exitReason === "DROPOUT"
        ? "DROPOUT"
        : student.user.status === "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE";
  return {
    rollNo: student.admissionNo,
    name: student.user.name,
    status,
    course: student.course?.title ?? null,
    courseCode: student.course?.code ?? null,
    durationMonths: student.course?.durationMonths ?? null,
    admissionDate: student.admissionDate,
  };
}
