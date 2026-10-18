import Link from "next/link";
import { connection } from "next/server";
import { ClipboardList, ListChecks, Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { Badge, Button, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { formatDate, percent } from "@/lib/utils";

async function getData(teacherId: string, courseIds: string[]) {
  await connection();
  const [courses, studentCount, quizzes, assignments, students, attendance, recentQuizzes, recentAssignments] =
    await Promise.all([
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        orderBy: { title: "asc" },
        include: { _count: { select: { students: true, quizzes: true, assignments: true } } },
      }),
      prisma.student.count({ where: { courseId: { in: courseIds } } }),
      prisma.quiz.count({ where: { teacherId } }),
      prisma.assignment.count({ where: { teacherId } }),
      prisma.student.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true, courseId: true },
      }),
      prisma.attendance.findMany({
        where: { student: { courseId: { in: courseIds } } },
        select: { studentId: true, status: true },
      }),
      prisma.quiz.findMany({
        where: { teacherId },
        include: { course: true, _count: { select: { questions: true, attempts: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.assignment.findMany({
        where: { teacherId },
        include: { course: true, _count: { select: { submissions: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const courseOf = new Map(students.map((s) => [s.id, s.courseId]));
  const tally = new Map<string, { present: number; total: number }>();
  for (const rec of attendance) {
    const courseId = courseOf.get(rec.studentId);
    if (!courseId) continue;
    const t = tally.get(courseId) ?? { present: 0, total: 0 };
    t.total += 1;
    if (rec.status === "PRESENT") t.present += 1;
    tally.set(courseId, t);
  }
  const attendancePct: Record<string, number> = {};
  for (const c of courses) {
    const t = tally.get(c.id);
    attendancePct[c.id] = t ? percent(t.present, t.total) : 0;
  }

  return { courses, studentCount, quizzes, assignments, recentQuizzes, recentAssignments, attendancePct };
}

export default async function TeacherDashboard() {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const teacherId = teacher?.id ?? "";
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const data = await getData(teacherId, courseIds);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Your teaching overview"
        action={
          <Link href="/teacher/quizzes">
            <Button><Plus className="h-4 w-4" /> Create Quiz</Button>
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={data.studentCount} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Quizzes" value={data.quizzes} icon={<ListChecks className="h-5 w-5" />} tone="blue" />
        <StatCard label="Assignments" value={data.assignments} icon={<ClipboardList className="h-5 w-5" />} tone="green" />
        <StatCard label="Courses" value={courseIds.length} icon={<Users className="h-5 w-5" />} tone="amber" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Course Analytics" subtitle="Course-wise students, attendance, quizzes and assignments" />
        <Table head={["Course", "Students", "Attendance", "Quizzes", "Assignments"]}>
          {data.courses.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{c.title}</td>
              <td className="px-4 py-3 text-slate-600">{c._count.students}</td>
              <td className="px-4 py-3">
                <AttendanceBadge pct={data.attendancePct[c.id] ?? 0} has={c._count.students > 0} />
              </td>
              <td className="px-4 py-3 text-slate-600">{c._count.quizzes}</td>
              <td className="px-4 py-3 text-slate-600">{c._count.assignments}</td>
            </tr>
          ))}
          {data.courses.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No courses assigned yet.</td></tr>
          )}
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Quizzes" action={<Link href="/teacher/quizzes" className="text-xs font-medium text-brand-600">View all</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.recentQuizzes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-slate-800">{q.title}</p>
                  <p className="text-xs text-slate-400">{q.course.title} · {q._count.questions} questions · {q.totalMarks} marks</p>
                </div>
                <Badge tone={q.status === "ASSIGNED" ? "green" : "gray"}>{q.status}</Badge>
              </li>
            ))}
            {data.recentQuizzes.length === 0 && <li className="p-8 text-center text-sm text-slate-400">No quizzes yet.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recent Assignments" action={<Link href="/teacher/assignments" className="text-xs font-medium text-brand-600">View all</Link>} />
          <ul className="divide-y divide-slate-100">
            {data.recentAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {a.course.title} · {a._count.submissions} submission(s){a.dueDate ? ` · due ${formatDate(a.dueDate)}` : ""}
                  </p>
                </div>
                <Badge tone={a.status === "ASSIGNED" ? "green" : "gray"}>{a.status}</Badge>
              </li>
            ))}
            {data.recentAssignments.length === 0 && <li className="p-8 text-center text-sm text-slate-400">No assignments yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function AttendanceBadge({ pct, has }: { pct: number; has: boolean }) {
  if (!has) return <span className="text-slate-400">—</span>;
  const tone = pct >= 75 ? "green" : pct >= 50 ? "amber" : "red";
  return <Badge tone={tone}>{pct}%</Badge>;
}
