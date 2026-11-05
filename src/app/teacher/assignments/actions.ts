"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";

function daysToDate(base: Date, days: number) {
  return new Date(base.getTime() + days * 86_400_000);
}

function readDays(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

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

export async function createAssignment(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  if (!teacher) redirect("/teacher/assignments");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  const marksRaw = formData.get("marks");
  const marks = Number(marksRaw);
  const days = readDays(formData.get("days"));
  const courseIds = teacher.courses.map((c) => c.id);

  if (
    !title ||
    !courseIds.includes(courseId) ||
    marksRaw === null ||
    marksRaw === "" ||
    !Number.isFinite(marks) ||
    marks < 1
  ) {
    redirect("/teacher/assignments?error=required");
  }

  const attachments = await readFiles(formData);
  const assignment = await prisma.assignment.create({
    data: {
      title,
      description: description || null,
      courseId,
      teacherId: teacher.id,
      marks: Math.floor(marks),
      dueDate: days ? daysToDate(new Date(), days) : null,
      status: "DRAFT",
      attachments: attachments.length ? { create: attachments } : undefined,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher");
  redirect(`/teacher/assignments/${assignment.id}?created=1`);
}

export async function updateAssignment(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/assignments");

  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) redirect("/teacher/assignments?error=notfound");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  const marks = Math.max(0, Number(formData.get("marks") ?? 0) || 0);
  const days = readDays(formData.get("days"));
  const courseIds = teacher.courses.map((c) => c.id);

  if (!title || !courseIds.includes(courseId)) redirect(`/teacher/assignments/${id}?error=required`);

  const attachments = await readFiles(formData);
  await prisma.assignment.update({
    where: { id },
    data: {
      title,
      description: description || null,
      courseId,
      marks,
      dueDate: days ? daysToDate(existing.createdAt, days) : null,
      attachments: attachments.length ? { create: attachments } : undefined,
    },
  });

  revalidatePath(`/teacher/assignments/${id}`);
  redirect(`/teacher/assignments/${id}?updated=1`);
}

export async function deleteAssignmentAttachment(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const attachment = await prisma.assignmentAttachment.findUnique({
    where: { id },
    include: { assignment: { select: { teacherId: true } } },
  });
  if (!attachment || attachment.assignment.teacherId !== teacher.id) return;
  await prisma.assignmentAttachment.delete({ where: { id } });
  revalidatePath(`/teacher/assignments/${attachment.assignmentId}`);
}

export async function toggleAssignmentStatus(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== teacher.id) return;
  await prisma.assignment.update({
    where: { id },
    data: { status: assignment.status === "ASSIGNED" ? "DRAFT" : "ASSIGNED" },
  });
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${id}`);
  revalidatePath("/teacher");
}

export async function deleteAssignment(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== teacher.id) return;
  await prisma.assignment.delete({ where: { id } });
  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher");
  redirect("/teacher/assignments?deleted=1");
}
