import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export const ASSESSMENT_TYPES = [
  "Written Paper",
  "Verbal / Oral",
  "Practical",
  "Presentation",
  "Class Test",
  "Other",
] as const;

export const MARK_STATUS_LABEL = {
  MARKED: "Marked",
  ABSENT: "Absent",
  NOT_SUBMITTED: "Not submitted",
} as const;

/** Base path of the assessments pages for this role. */
export function assessmentsPath(role: "ADMIN" | "TEACHER") {
  return role === "ADMIN" ? "/admin/assessments" : "/teacher/assessments";
}

/**
 * Courses this user may manage assessments for: every course for an admin,
 * only their own courses for a teacher. Returns null for anyone else.
 */
export async function manageableCourses(user: SessionUser | null) {
  if (!user) return null;
  if (user.role === "ADMIN") {
    return prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });
  }
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!teacher) return [];
    return prisma.course.findMany({
      where: { teacherId: teacher.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    });
  }
  return null;
}

export function percentOf(marks: number | null | undefined, total: number) {
  if (marks == null || total <= 0) return null;
  return Math.round((marks / total) * 1000) / 10;
}
