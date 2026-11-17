"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { readUploadedFiles } from "@/lib/uploads";


export async function submitAssignment(formData: FormData) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!student || !assignmentId) redirect("/student/assignments");

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment || assignment.status !== "ASSIGNED" || assignment.courseId !== student.courseId) {
    redirect("/student/assignments");
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 5000);
  const upload = await readUploadedFiles(formData);
  if (!upload.ok) redirect(`/student/assignments/${assignmentId}?error=${upload.error}`);
  const files = upload.files;

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
  });

  if (existing) {
    // Students can submit only once. After submitting, they cannot update it.
    redirect(`/student/assignments/${assignmentId}`);
  }

  try {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        note: note || null,
        files: files.length ? { create: files } : undefined,
      },
    });
  } catch (error) {
    // Double submit (two tabs / double-click): keep the first submission.
    if ((error as { code?: string })?.code !== "P2002") throw error;
  }

  revalidatePath("/student/assignments");
  redirect(`/student/assignments/${assignmentId}?submitted=1`);
}
