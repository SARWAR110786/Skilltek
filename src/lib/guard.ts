import { redirect } from "next/navigation";
import { getSession, type SessionUser, type Role } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser(role: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== role) {
    redirect("/login");
  }
  return user;
}

export async function getTeacherProfile(userId: string) {
  return prisma.teacher.findUnique({
    where: { userId },
    include: { courses: { select: { id: true } } },
  });
}

export async function getStudentProfile(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: { course: { include: { teacher: { include: { user: true } } } } },
  });
}
