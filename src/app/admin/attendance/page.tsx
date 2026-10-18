import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { AttendanceTable } from "@/components/attendance-table";
import { DownloadForm } from "@/components/download-form";
import { dateInputValue, parseDateInput } from "@/lib/utils";

export const instant = false;

async function getData(courseParam: string | undefined, dateValue: string) {
  await connection();
  const date = parseDateInput(dateValue);
  const courses = await prisma.course.findMany({ orderBy: { title: "asc" } });
  const courseId = courses.find((c) => c.id === courseParam)?.id ?? courses[0]?.id ?? "";

  const students = courseId
    ? await prisma.student.findMany({
        where: { courseId },
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

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; date?: string; saved?: string }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;
  const dateValue = sp.date ?? dateInputValue();
  const { courses, courseId, students, statusMap } = await getData(sp.course, dateValue);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark and review attendance course-wise" />

      <Card className="mb-6">
        <CardHeader title="Download attendance" subtitle="Export a single day or a whole month as CSV or PDF" />
        <div className="p-5">
          <DownloadForm
            action="/api/export/attendance"
            fields={[
              {
                kind: "select",
                name: "course",
                label: "Course",
                defaultValue: courseId,
                options: courses.map((c) => ({ value: c.id, label: c.title })),
              },
              {
                kind: "select",
                name: "range",
                label: "Range",
                defaultValue: "day",
                options: [
                  { value: "day", label: "Day (single date)" },
                  { value: "month", label: "Monthly" },
                ],
              },
              { kind: "date", name: "date", label: "Date", defaultValue: dateValue },
              {
                kind: "month",
                name: "month",
                label: "Month",
                defaultValue: dateValue.slice(0, 7),
              },
            ]}
          />
        </div>
      </Card>

      <AttendanceTable
        courses={courses}
        courseId={courseId}
        dateValue={dateValue}
        students={students}
        statusMap={statusMap}
        basePath="/admin/attendance"
        justSaved={sp.saved === "1"}
      />
    </div>
  );
}
