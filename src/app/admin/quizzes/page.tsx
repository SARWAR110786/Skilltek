import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";

export const instant = false;

async function getData() {
  await connection();
  const [courses, quizzes] = await Promise.all([
    prisma.course.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { students: true } } },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true } },
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { questions: true, attempts: true } },
      },
    }),
  ]);
  return { courses, quizzes };
}

function filterChip(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer",
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
  );
}

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; quiz?: string }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;
  const courseFilter = sp.course ?? "";
  const { courses, quizzes } = await getData();

  const activeCourse = courses.find((c) => c.id === courseFilter);
  const visibleQuizzes = courseFilter ? quizzes.filter((q) => q.courseId === courseFilter) : quizzes;

  const totalAttempts = quizzes.reduce((n, q) => n + q._count.attempts, 0);

  const selectedQuiz = sp.quiz ? quizzes.find((q) => q.id === sp.quiz) ?? null : null;
  const attempts = selectedQuiz
    ? await prisma.quizAttempt.findMany({
        where: { quizId: selectedQuiz.id },
        include: { student: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={activeCourse ? `Quizzes · ${activeCourse.title}` : "Quizzes"}
        subtitle={
          activeCourse
            ? `${visibleQuizzes.length} quiz${visibleQuizzes.length === 1 ? "" : "zes"} · ${activeCourse._count.students} students enrolled`
            : "Select a course to view its quizzes one by one"
        }
        action={
          activeCourse ? (
            <Link href="/admin/quizzes">
              <Badge tone="gray">Clear filter</Badge>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Quizzes" value={quizzes.length} tone="blue" />
        <StatCard label="Attempts" value={totalAttempts} tone="green" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Course wise:</span>
        <Link href="/admin/quizzes" className={filterChip(courseFilter === "")}>
          All Courses
        </Link>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/quizzes?course=${c.id}`}
            className={filterChip(courseFilter === c.id)}
          >
            {c.title} ({c._count.students})
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader
          title={activeCourse ? `Quizzes in ${activeCourse.title}` : "All Quizzes"}
          subtitle="Click a quiz to view attempts with student names and marks"
        />
        <Table head={["Quiz", "Course", "Teacher", "Questions", "Marks", "Attempts", "Status"]}>
          {visibleQuizzes.map((q) => (
            <tr key={q.id} className={cn("hover:bg-slate-50", sp.quiz === q.id && "bg-brand-50")}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/quizzes?${courseFilter ? `course=${courseFilter}&` : ""}quiz=${q.id}`}
                  className="font-medium text-slate-800 hover:text-brand-600"
                >
                  {q.title}
                </Link>
                {sp.quiz === q.id && <span className="ml-2 text-xs text-brand-600">▾ attempts below</span>}
              </td>
              <td className="px-4 py-3 text-slate-600">{q.course.title}</td>
              <td className="px-4 py-3 text-slate-600">{q.teacher.user.name}</td>
              <td className="px-4 py-3 text-slate-600">{q._count.questions}</td>
              <td className="px-4 py-3 text-slate-600">{q.totalMarks}</td>
              <td className="px-4 py-3"><Badge tone={q._count.attempts > 0 ? "green" : "gray"}>{q._count.attempts}</Badge></td>
              <td className="px-4 py-3"><Badge tone={q.status === "ASSIGNED" ? "green" : "gray"}>{q.status}</Badge></td>
            </tr>
          ))}
          {visibleQuizzes.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No quizzes yet.</td></tr>
          )}
        </Table>
      </Card>

      {selectedQuiz && (
        <Card>
          <CardHeader
            title={`Attempts · ${selectedQuiz.title}`}
            subtitle={`${attempts.length} student${attempts.length === 1 ? "" : "s"} attempted · ${selectedQuiz.course.title}`}
          />
          <Table head={["Student", "Email", "Marks", "Result", "Submitted"]}>
            {attempts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{a.student.user.name}</td>
                <td className="px-4 py-3 text-slate-600">{a.student.user.email}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {a.score}/{a.total}
                </td>
                <td className="px-4 py-3">
                  {a.violated ? (
                    <Badge tone="red">Violated</Badge>
                  ) : (
                    <Badge tone={a.score >= a.total / 2 ? "green" : "amber"}>
                      {a.score >= a.total / 2 ? "Passed" : "Low"}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(a.submittedAt)}</td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No attempts yet.</td></tr>
            )}
          </Table>
        </Card>
      )}
    </div>
  );
}
