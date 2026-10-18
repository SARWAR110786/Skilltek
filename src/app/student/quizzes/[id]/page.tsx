import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Alert, Card, CardHeader, PageHeader } from "@/components/ui";
import { QuizRunner } from "@/components/quiz-runner";
import { QuizResult } from "@/components/quiz-result";
import { submitQuiz } from "../actions";

function optionsOf(q: { optionA: string; optionB: string; optionC: string | null; optionD: string | null }) {
  return [
    ["A", q.optionA],
    ["B", q.optionB],
    ["C", q.optionC],
    ["D", q.optionD],
  ].filter((o): o is [string, string] => Boolean(o[1]));
}

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const { id } = await params;

  if (!student) notFound();
  await connection();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: { order: "asc" }, include: { question: true } } },
  });

  if (!quiz || quiz.status !== "ASSIGNED" || quiz.courseId !== student.courseId) notFound();

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId: quiz.id, studentId: student.id } },
  });

  return (
    <div>
      <Link href="/student/quizzes" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to quizzes
      </Link>

      {attempt ? (
        <QuizResult score={attempt.score} total={attempt.total} violated={attempt.violated} />
      ) : (
        <>
          <PageHeader
            title={quiz.title}
            subtitle={`${quiz.course.title} · ${quiz.questions.length} questions · ${quiz.totalMarks} marks · ${quiz.durationMinutes} min`}
          />
          {quiz.description && <p className="mb-6 text-sm text-slate-500">{quiz.description}</p>}
          <QuizRunner action={submitQuiz} quizId={quiz.id} durationMinutes={quiz.durationMinutes}>
            <div className="space-y-4">
              {quiz.questions.map((qq, i) => (
                <Card key={qq.id}>
                  <CardHeader title={`Question ${i + 1}`} subtitle={`${qq.question.marks} mark${qq.question.marks === 1 ? "" : "s"}`} />
                  <div className="p-5">
                    <p className="font-medium text-slate-800">{qq.question.text}</p>
                    <div className="mt-3 space-y-2">
                      {optionsOf(qq.question).map(([key, label]) => (
                        <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                          <input type="radio" name={`q_${qq.questionId}`} value={key} className="h-4 w-4" />
                          <span><span className="font-medium">{key})</span> {label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </QuizRunner>
        </>
      )}
    </div>
  );
}
