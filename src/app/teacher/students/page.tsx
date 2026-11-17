import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, Table } from "@/components/ui";
import { StudentsAutoSearch } from "@/components/students-auto-search";
import { studentStatusLabel, studentStatusTone } from "@/lib/student-status";
import type { Prisma } from "@/generated/prisma/client";

async function getStudents(courseIds: string[], courseParam?: string, query?: string) {
  await connection();
  const scoped = courseParam && courseIds.includes(courseParam) ? [courseParam] : courseIds;
  const q = query?.trim();

  const where: Prisma.StudentWhereInput = q
    ? {
        courseId: { in: scoped },
        OR: [
          { admissionNo: { contains: q, mode: "insensitive" } },
          { cnic: { contains: q, mode: "insensitive" } },
          { guardianName: { contains: q, mode: "insensitive" } },
          { guardianPhone: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
          { course: { title: { contains: q, mode: "insensitive" } } },
        ],
      }
    : { courseId: { in: scoped } };

  return prisma.student.findMany({
    where,
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
  searchParams: Promise<{ course?: string; q?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const sp = await searchParams;
  const courseFilter = sp.course && courseIds.includes(sp.course) ? sp.course : "";
  const query = (sp.q ?? "").trim();

  const [students, courses] = await Promise.all([
    getStudents(courseIds, courseFilter || undefined, query || undefined),
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
        subtitle={`${students.length} student${students.length === 1 ? "" : "s"}${query ? ` matching "${query}"` : ""}`}
      />
      <Card>
        <CardHeader
          title={activeCourse ? `Students in ${activeCourse.title}` : "Students"}
          action={
            <StudentsAutoSearch defaultValue={query} courseFilter={courseFilter || undefined} />
          }
        />
        <Table head={["Student", "Roll No", "Course", "Guardian", "Status"]}>
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{s.user.name}</p>
                <p className="text-xs text-slate-400">{s.user.email}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.admissionNo}</td>
              <td className="px-4 py-3 text-slate-600">{s.course?.title ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {s.guardianName ?? "—"}
                {s.guardianPhone ? <span className="block text-xs text-slate-400">{s.guardianPhone}</span> : null}
              </td>
              <td className="px-4 py-3">
                <Badge tone={studentStatusTone(s.user.status, s.exitReason)}>
                  {studentStatusLabel(s.user.status, s.exitReason)}
                </Badge>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                {query ? `No students match "${query}".` : "No students yet."}
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
