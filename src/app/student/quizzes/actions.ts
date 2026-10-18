"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";

export async function submitQuiz(formData: FormData) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const quizId = String(formData.get("quizId") ?? "");
  if (!student || !quizId) redirect("/student/quizzes");

  const violated = formData.get("violated") === "1";

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" }, include: { question: true } } },
  });
  if (!quiz || quiz.status !== "ASSIGNED" || quiz.courseId !== student.courseId) {
    redirect("/student/quizzes");
  }

  const existing = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId: student.id } },
  });
  if (existing) redirect(`/student/quizzes/${quizId}`);

  let score = 0;
  let total = 0;
  const answers: Record<string, string> = {};
  for (const q of quiz.questions) {
    total += q.question.marks;
    const selected = String(formData.get(`q_${q.questionId}`) ?? "");
    answers[q.questionId] = selected;
    if (selected && selected === q.question.correctOption) score += q.question.marks;
  }

  await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId: student.id,
      score: violated ? 0 : score,
      total,
      answers,
      violated,
    },
  });

  revalidatePath("/student/quizzes");
  redirect(`/student/quizzes/${quizId}?submitted=1`);
}
