"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  // A blank box means "not graded yet" (Number("") would wrongly be 0), and
  // marks are whole numbers in the database, so round instead of failing.
  const raw = String(formData.get("marksObtained") ?? "").trim();
  const marks = Number(raw);
  const marksObtained =
    raw === "" || !Number.isFinite(marks)
      ? null
      : Math.max(0, Math.min(submission.assignment.marks || marks, Math.round(marks)));
  await prisma.assignmentSubmission.update({
    where: { id },
    data: { marksObtained },
  });
  revalidatePath(`/teacher/assignments/${submission.assignmentId}`);
  revalidatePath(`/teacher/assignments/${submission.assignmentId}/submissions`);

  const returnTo = String(formData.get("returnTo") ?? "");
  if (returnTo.startsWith("/teacher/assignments/")) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?graded=1`);
  }
}

export async function gradeSubmissionsBulk(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!teacher || !assignmentId) return;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, teacherId: true, marks: true },
  });
  if (!assignment || assignment.teacherId !== teacher.id) return;

  const updates: { id: string; marksObtained: number | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("marks_")) continue;
    const id = key.slice("marks_".length);
    if (!id) continue;
    const raw = String(value ?? "");
    if (raw === "") {
      updates.push({ id, marksObtained: null });
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    updates.push({
      id,
      marksObtained: Math.max(0, Math.min(assignment.marks, Math.round(n))),
    });
  }

  const ids = updates.map((u) => u.id);
  if (ids.length > 0) {
    const valid = await prisma.assignmentSubmission.findMany({
      where: { id: { in: ids }, assignmentId: assignment.id },
      select: { id: true },
    });
    const validIds = new Set(valid.map((v) => v.id));
    const safe = updates.filter((u) => validIds.has(u.id));
    if (safe.length > 0) {
      await prisma.$transaction(
        safe.map((u) =>
          prisma.assignmentSubmission.update({
            where: { id: u.id },
            data: { marksObtained: u.marksObtained },
          }),
        ),
      );
    }
  }

  revalidatePath(`/teacher/assignments/${assignment.id}`);
  revalidatePath(`/teacher/assignments/${assignment.id}/submissions`);
  revalidatePath("/teacher/assignments");
  redirect(`/teacher/assignments/${assignment.id}/submissions?saved=1`);
}
