"use server";


import { guard } from "@/lib/safe-action";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { readUploadedFiles } from "@/lib/uploads";

function daysToDate(base: Date, days: number) {
  return new Date(base.getTime() + days * 86_400_000);
}

function readDays(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}


async function createAssignment__impl(formData: FormData) {
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

  // Double-click / resend guard: the same teacher creating the same title in
  // the same course within 2 minutes reuses the assignment already created.
  const recent = await prisma.assignment.findFirst({
    where: {
      teacherId: teacher.id,
      courseId,
      title,
      createdAt: { gte: new Date(Date.now() - 2 * 60_000) },
    },
    select: { id: true },
  });
  if (recent) redirect(`/teacher/assignments/${recent.id}?created=1`);

  const upload = await readUploadedFiles(formData);
  if (!upload.ok) redirect(`/teacher/assignments?error=${upload.error}`);
  const attachments = upload.files;
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

async function updateAssignment__impl(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/assignments");

  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) redirect("/teacher/assignments?error=notfound");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  const marks = Math.floor(Math.max(0, Number(formData.get("marks") ?? 0) || 0));
  const days = readDays(formData.get("days"));
  const courseIds = teacher.courses.map((c) => c.id);

  if (!title || !courseIds.includes(courseId)) redirect(`/teacher/assignments/${id}?error=required`);

  const upload = await readUploadedFiles(formData);
  if (!upload.ok) redirect(`/teacher/assignments/${id}?error=${upload.error}`);
  const attachments = upload.files;
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

async function deleteAssignmentAttachment__impl(formData: FormData) {
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

async function toggleAssignmentStatus__impl(formData: FormData) {
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

async function deleteAssignment__impl(formData: FormData) {
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createAssignment(...args: Parameters<typeof createAssignment__impl>) {
  return guard(() => createAssignment__impl(...args));
}

export async function updateAssignment(...args: Parameters<typeof updateAssignment__impl>) {
  return guard(() => updateAssignment__impl(...args));
}

export async function deleteAssignmentAttachment(...args: Parameters<typeof deleteAssignmentAttachment__impl>) {
  return guard(() => deleteAssignmentAttachment__impl(...args));
}

export async function toggleAssignmentStatus(...args: Parameters<typeof toggleAssignmentStatus__impl>) {
  return guard(() => toggleAssignmentStatus__impl(...args));
}

export async function deleteAssignment(...args: Parameters<typeof deleteAssignment__impl>) {
  return guard(() => deleteAssignment__impl(...args));
}
