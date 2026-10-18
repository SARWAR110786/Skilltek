"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";

export async function gradeSubmission(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id },
    include: { assignment: { select: { teacherId: true, marks: true } } },
  });
  if (!submission || submission.assignment.teacherId !== teacher.id) return;
  const marks = Number(formData.get("marksObtained") ?? "");
  const marksObtained = isNaN(marks) ? null : Math.max(0, Math.min(submission.assignment.marks || marks, marks));
  await prisma.assignmentSubmission.update({
    where: { id },
    data: { marksObtained },
  });
  revalidatePath(`/teacher/assignments/${submission.assignmentId}`);
}
