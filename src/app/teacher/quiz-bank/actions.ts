"use server";


import { guard } from "@/lib/safe-action";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";

const OPTIONS = ["A", "B", "C", "D"];

function readForm(formData: FormData) {
  const correctOption = String(formData.get("correctOption") ?? "A").toUpperCase();
  return {
    text: String(formData.get("text") ?? "").trim(),
    optionA: String(formData.get("optionA") ?? "").trim(),
    optionB: String(formData.get("optionB") ?? "").trim(),
    optionC: String(formData.get("optionC") ?? "").trim(),
    optionD: String(formData.get("optionD") ?? "").trim(),
    correctOption: OPTIONS.includes(correctOption) ? correctOption : "A",
    marks: Math.max(1, Number(formData.get("marks") ?? 1) || 1),
    courseId: String(formData.get("courseId") ?? "").trim(),
  };
}

async function createBankQuestion__impl(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  if (!teacher) redirect("/teacher/quiz-bank");
  const f = readForm(formData);
  if (!f.text || !f.optionA || !f.optionB || !f.optionC || !f.optionD) redirect("/teacher/quiz-bank?error=required");

  const courseIds = teacher.courses.map((c) => c.id);
  if (!courseIds.includes(f.courseId)) redirect("/teacher/quiz-bank?error=required");
  await prisma.quizBankQuestion.create({
    data: {
      teacherId: teacher.id,
      courseId: f.courseId,
      text: f.text,
      optionA: f.optionA,
      optionB: f.optionB,
      optionC: f.optionC || null,
      optionD: f.optionD || null,
      correctOption: f.correctOption,
      marks: 1,
    },
  });
  revalidatePath("/teacher/quiz-bank");
  redirect("/teacher/quiz-bank?created=1");
}

async function updateBankQuestion__impl(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/quiz-bank");
  const existing = await prisma.quizBankQuestion.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) redirect("/teacher/quiz-bank?error=notfound");

  const f = readForm(formData);
  if (!f.text || !f.optionA || !f.optionB || !f.optionC || !f.optionD) redirect(`/teacher/quiz-bank?edit=${id}&error=required`);

  const courseIds = teacher.courses.map((c) => c.id);
  if (!courseIds.includes(f.courseId)) redirect(`/teacher/quiz-bank?edit=${id}&error=required`);
  await prisma.quizBankQuestion.update({
    where: { id },
    data: {
      courseId: f.courseId,
      text: f.text,
      optionA: f.optionA,
      optionB: f.optionB,
      optionC: f.optionC || null,
      optionD: f.optionD || null,
      correctOption: f.correctOption,
    },
  });
  revalidatePath("/teacher/quiz-bank");
  redirect("/teacher/quiz-bank?updated=1");
}

async function deleteBankQuestion__impl(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const existing = await prisma.quizBankQuestion.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) return;
  await prisma.quizBankQuestion.delete({ where: { id } });
  revalidatePath("/teacher/quiz-bank");
}

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createBankQuestion(...args: Parameters<typeof createBankQuestion__impl>) {
  return guard(() => createBankQuestion__impl(...args));
}

export async function updateBankQuestion(...args: Parameters<typeof updateBankQuestion__impl>) {
  return guard(() => updateBankQuestion__impl(...args));
}

export async function deleteBankQuestion(...args: Parameters<typeof deleteBankQuestion__impl>) {
  return guard(() => deleteBankQuestion__impl(...args));
}
