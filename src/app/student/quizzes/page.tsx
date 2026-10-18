import Link from "next/link";
import { connection } from "next/server";
import { ClipboardList, Timer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Badge, Card, PageHeader } from "@/components/ui";

async function getQuizzes(courseId: string, studentId: string) {
  await connection();
  return prisma.quiz.findMany({
    where: { status: "ASSIGNED", courseId },
    include: {
      teacher: { include: { user: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function StudentQuizzesPage() {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);

  if (!student?.courseId) {
    return (
      <div>
        <PageHeader title="Quizzes" />
        <Card><p className="p-10 text-center text-sm text-slate-500">You are not enrolled in a course yet.</p></Card>
      </div>
    );
  }

  const quizzes = await getQuizzes(student.courseId, student.id);

  return (
    <div>
      <PageHeader title="Quizzes" subtitle={`${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"} assigned to your course`} />
      <div className="space-y-4">
        {quizzes.map((q) => {
          const attempt = q.attempts[0];
          return (
            <Card key={q.id}>
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{q.title}</h3>
                    {attempt ? (
                      attempt.violated
                        ? <Badge tone="red">Violated</Badge>
                        : <Badge tone="green">Scored {attempt.score}/{attempt.total}</Badge>
                    ) : (
                      <Badge tone="amber">Not attempted</Badge>
                    )}
                  </div>
                  {q.description && <p className="mt-1 text-sm text-slate-500">{q.description}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {q._count.questions} questions</span>
                    <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {q.durationMinutes} min</span>
                    <span>{q.totalMarks} marks</span>
                    <span>By {q.teacher.user.name}</span>
                  </p>
                </div>
                <Link
                  href={`/student/quizzes/${q.id}`}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  {attempt ? "View Result" : "Start Quiz"}
                </Link>
              </div>
            </Card>
          );
        })}
        {quizzes.length === 0 && (
          <Card><p className="p-10 text-center text-sm text-slate-400">No quizzes assigned yet.</p></Card>
        )}
      </div>
    </div>
  );
}
