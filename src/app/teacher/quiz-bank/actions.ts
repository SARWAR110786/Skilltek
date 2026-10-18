"use server";

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

export async function createBankQuestion(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  if (!teacher) redirect("/teacher/quiz-bank");
  const f = readForm(formData);
  if (!f.text || !f.optionA || !f.optionB) redirect("/teacher/quiz-bank?error=required");

  const courseIds = teacher.courses.map((c) => c.id);
  await prisma.quizBankQuestion.create({
    data: {
      teacherId: teacher.id,
      courseId: courseIds.includes(f.courseId) ? f.courseId : null,
      text: f.text,
      optionA: f.optionA,
      optionB: f.optionB,
      optionC: f.optionC || null,
      optionD: f.optionD || null,
      correctOption: f.correctOption,
      marks: f.marks,
    },
  });
  revalidatePath("/teacher/quiz-bank");
  redirect("/teacher/quiz-bank?created=1");
}

export async function updateBankQuestion(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/quiz-bank");
  const existing = await prisma.quizBankQuestion.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) redirect("/teacher/quiz-bank?error=notfound");

  const f = readForm(formData);
  if (!f.text || !f.optionA || !f.optionB) redirect(`/teacher/quiz-bank?edit=${id}&error=required`);

  const courseIds = teacher.courses.map((c) => c.id);
  await prisma.quizBankQuestion.update({
    where: { id },
    data: {
      courseId: courseIds.includes(f.courseId) ? f.courseId : null,
      text: f.text,
      optionA: f.optionA,
      optionB: f.optionB,
      optionC: f.optionC || null,
      optionD: f.optionD || null,
      correctOption: f.correctOption,
      marks: f.marks,
    },
  });
  revalidatePath("/teacher/quiz-bank");
  redirect("/teacher/quiz-bank?updated=1");
}

export async function deleteBankQuestion(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const existing = await prisma.quizBankQuestion.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== teacher.id) return;
  await prisma.quizBankQuestion.delete({ where: { id } });
  revalidatePath("/teacher/quiz-bank");
}
