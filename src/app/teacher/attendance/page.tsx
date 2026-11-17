import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { AttendanceTable } from "@/components/attendance-table";
import { dateInputValue, parseDateInput } from "@/lib/utils";

async function getData(courseParam: string | undefined, dateValue: string, courseIds: string[]) {
  await connection();
  const date = parseDateInput(dateValue);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    orderBy: { title: "asc" },
  });
  const courseId = courses.find((c) => c.id === courseParam)?.id ?? courses[0]?.id ?? "";

  const students = courseId
    ? await prisma.student.findMany({
        // Inactive is a temporary login block only; dropouts/passouts are excluded.
        where: { courseId, exitReason: null },
        include: { user: true },
        orderBy: { admissionNo: "asc" },
      })
    : [];

  const records = students.length
    ? await prisma.attendance.findMany({
        where: { studentId: { in: students.map((s) => s.id) }, date },
      })
    : [];

  return {
    courses: courses.map((c) => ({ id: c.id, title: c.title })),
    courseId,
    students: students.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      admissionNo: s.admissionNo,
    })),
    statusMap: Object.fromEntries(records.map((r) => [r.studentId, r.status])) as Record<string, string>,
  };
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; date?: string; saved?: string; error?: string }>;
}) {
  // Default date uses new Date(), so defer this page to request time first.
  await connection();
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const sp = await searchParams;
  const dateValue = sp.date ?? dateInputValue();
  const { courses, courseId, students, statusMap } = await getData(sp.course, dateValue, courseIds);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark attendance for a course" />
      {(sp.error === "future" || (sp as any).future) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Attendance cannot be marked for future dates.
        </div>
      )}

      <AttendanceTable
        key={`${courseId}-${dateValue}`}
        courses={courses}
        courseId={courseId}
        dateValue={dateValue}
        students={students}
        statusMap={statusMap}
        basePath="/teacher/attendance"
        justSaved={sp.saved === "1"}
      />
    </div>
  );
}
