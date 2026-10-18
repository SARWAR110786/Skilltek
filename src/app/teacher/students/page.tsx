import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui";

async function getStudents(courseIds: string[], courseParam?: string) {
  await connection();
  const scoped = courseParam && courseIds.includes(courseParam) ? [courseParam] : courseIds;
  return prisma.student.findMany({
    where: { courseId: { in: scoped } },
    include: {
      user: true,
      course: { include: { teacher: { include: { user: true } } } },
    },
    orderBy: { admissionNo: "asc" },
  });
}

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const sp = await searchParams;
  const courseFilter = sp.course && courseIds.includes(sp.course) ? sp.course : "";

  const [students, courses] = await Promise.all([
    getStudents(courseIds, courseFilter || undefined),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      orderBy: { title: "asc" },
    }),
  ]);

  const activeCourse = courses.find((c) => c.id === courseFilter);

  return (
    <div>
      <PageHeader
        title={activeCourse ? `My Students · ${activeCourse.title}` : "My Students"}
        subtitle={`${students.length} student${students.length === 1 ? "" : "s"}`}
        action={
          activeCourse ? (
            <Link href="/teacher/students">
              <Badge tone="gray">Clear filter</Badge>
            </Link>
          ) : undefined
        }
      />
      <Card>
        <CardHeader title={activeCourse ? `Students in ${activeCourse.title}` : "Students"} />
        <Table head={["Student", "Admission #", "Course", "Guardian", "Status"]}>
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{s.user.name}</p>
                <p className="text-xs text-slate-400">{s.user.email}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.admissionNo}</td>
              <td className="px-4 py-3 text-slate-600">{s.course?.title ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{s.guardianName ?? "—"}</td>
              <td className="px-4 py-3"><Badge tone={s.user.status === "ACTIVE" ? "green" : "gray"}>{s.user.status}</Badge></td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No students yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
