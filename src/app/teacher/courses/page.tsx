import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui";

async function getCourses(courseIds: string[]) {
  await connection();
  return prisma.course.findMany({
    where: { id: { in: courseIds } },
    orderBy: { title: "asc" },
    include: { _count: { select: { students: true } } },
  });
}

export default async function TeacherCoursesPage() {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const courses = await getCourses(courseIds);

  return (
    <div>
      <PageHeader title="My Courses" subtitle={`${courses.length} course${courses.length === 1 ? "" : "s"} assigned to you`} />

      <Card>
        <CardHeader title="Courses" />
        <Table head={["Course", "Duration", "Students", "Actions"]}>
          {courses.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{c.title}</p>
                <p className="line-clamp-1 text-xs text-slate-400">{c.description ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{c.durationMonths} mo</td>
              <td className="px-4 py-3"><Badge tone="brand">{c._count.students}</Badge></td>
              <td className="px-4 py-3">
                <Link
                  href={`/teacher/students?course=${c.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                >
                  View Students
                </Link>
              </td>
            </tr>
          ))}
          {courses.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">No courses assigned yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
