"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";

async function gatherQuestions(teacherId: string, formData: FormData) {
  const questionIds = formData.getAll("questionIds").map(String).filter(Boolean);
  if (questionIds.length === 0) return { questions: [], totalMarks: 0 };
  const questions = await prisma.quizBankQuestion.findMany({
    where: { id: { in: questionIds }, teacherId },
  });
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  return { questions, totalMarks };
}

export async function createQuiz(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  if (!teacher) redirect("/teacher/quizzes");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  const durationMinutes = Math.max(1, Number(formData.get("durationMinutes") ?? 15) || 15);
  const courseIds = teacher.courses.map((c) => c.id);

  if (!title || !courseIds.includes(courseId)) redirect("/teacher/quizzes?error=required");

  const { questions, totalMarks } = await gatherQuestions(teacher.id, formData);
  if (questions.length === 0) redirect("/teacher/quizzes?error=noquestions");

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description: description || null,
      courseId,
      teacherId: teacher.id,
      durationMinutes,
      totalMarks,
      status: "DRAFT",
      questions: { create: questions.map((q, i) => ({ questionId: q.id, order: i })) },
    },
  });

  revalidatePath("/teacher/quizzes");
  revalidatePath("/teacher");
  redirect(`/teacher/quizzes/${quiz.id}?created=1`);
}

export async function updateQuiz(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/quizzes");

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz || quiz.teacherId !== teacher.id) redirect("/teacher/quizzes?error=notfound");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "");
  const durationMinutes = Math.max(1, Number(formData.get("durationMinutes") ?? 15) || 15);
  const courseIds = teacher.courses.map((c) => c.id);

  if (!title || !courseIds.includes(courseId)) redirect(`/teacher/quizzes/${id}?error=required`);

  const { questions, totalMarks } = await gatherQuestions(teacher.id, formData);
  if (questions.length === 0) redirect(`/teacher/quizzes/${id}?error=noquestions`);

  await prisma.quiz.update({
    where: { id },
    data: {
      title,
      description: description || null,
      courseId,
      durationMinutes,
      totalMarks,
      questions: {
        deleteMany: {},
        create: questions.map((q, i) => ({ questionId: q.id, order: i })),
      },
    },
  });

  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${id}`);
  redirect(`/teacher/quizzes/${id}?updated=1`);
}

export async function toggleQuizStatus(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz || quiz.teacherId !== teacher.id) return;
  await prisma.quiz.update({
    where: { id },
    data: { status: quiz.status === "ASSIGNED" ? "DRAFT" : "ASSIGNED" },
  });
  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${id}`);
  revalidatePath("/teacher");
}

export async function deleteQuiz(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) return;
  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz || quiz.teacherId !== teacher.id) return;
  await prisma.quiz.delete({ where: { id } });
  revalidatePath("/teacher/quizzes");
  revalidatePath("/teacher");
  redirect("/teacher/quizzes?deleted=1");
}
