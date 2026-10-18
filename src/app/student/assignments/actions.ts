"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";

async function readFiles(formData: FormData) {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  return Promise.all(
    files.map(async (f) => ({
      fileName: f.name,
      mimeType: f.type || "application/octet-stream",
      size: f.size,
      data: Buffer.from(await f.arrayBuffer()),
    })),
  );
}

export async function submitAssignment(formData: FormData) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!student || !assignmentId) redirect("/student/assignments");

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment || assignment.status !== "ASSIGNED" || assignment.courseId !== student.courseId) {
    redirect("/student/assignments");
  }

  const note = String(formData.get("note") ?? "").trim();
  const files = await readFiles(formData);

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
  });

  if (existing) {
    // Students can submit only once. After submitting, they cannot update it.
    redirect(`/student/assignments/${assignmentId}`);
  }

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId,
      studentId: student.id,
      note: note || null,
      files: files.length ? { create: files } : undefined,
    },
  });

  revalidatePath("/student/assignments");
  redirect(`/student/assignments/${assignmentId}?submitted=1`);
}
