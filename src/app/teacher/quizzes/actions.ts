"use server";


import { guard } from "@/lib/safe-action";
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

async function createQuiz__impl(formData: FormData) {
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

async function updateQuiz__impl(formData: FormData) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const id = String(formData.get("id") ?? "");
  if (!teacher || !id) redirect("/teacher/quizzes");

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { _count: { select: { attempts: true } } },
  });
  if (!quiz || quiz.teacherId !== teacher.id) redirect("/teacher/quizzes?error=notfound");
  // Once students have attempted a quiz its questions, course and marks are
  // locked; otherwise saved scores would no longer match the quiz.
  if (quiz._count.attempts > 0) redirect(`/teacher/quizzes/${id}?error=locked`);

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

async function toggleQuizStatus__impl(formData: FormData) {
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

async function deleteQuiz__impl(formData: FormData) {
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createQuiz(...args: Parameters<typeof createQuiz__impl>) {
  return guard(() => createQuiz__impl(...args));
}

export async function updateQuiz(...args: Parameters<typeof updateQuiz__impl>) {
  return guard(() => updateQuiz__impl(...args));
}

export async function toggleQuizStatus(...args: Parameters<typeof toggleQuizStatus__impl>) {
  return guard(() => toggleQuizStatus__impl(...args));
}

export async function deleteQuiz(...args: Parameters<typeof deleteQuiz__impl>) {
  return guard(() => deleteQuiz__impl(...args));
}
