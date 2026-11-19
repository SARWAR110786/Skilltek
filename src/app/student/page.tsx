import Link from "next/link";
import { connection } from "next/server";
import { CalendarCheck, CalendarDays, GraduationCap, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { formatDate, formatDateTime, percent } from "@/lib/utils";
import { StudentTopRank } from "@/components/student-top-rank";

async function getNotices() {
  await connection();
  return prisma.notice.findMany({
    where: { OR: [{ target: "ALL" }, { target: "STUDENTS" }] },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 5,
  });
}

async function getAttendancePct(studentId: string) {
  const records = await prisma.attendance.findMany({ where: { studentId } });
  const present = records.filter((r) => r.status === "PRESENT").length;
  return percent(present, records.length);
}

export default async function StudentDashboard() {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);

  if (!student) {
    return <Card><p className="p-10 text-center text-sm text-slate-500">Your student profile is not set up yet. Please contact the administration.</p></Card>;
  }

  const [notices, attendancePct] = await Promise.all([
    getNotices(),
    getAttendancePct(student.id),
  ]);

  const teacher = student.course?.teacher;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        subtitle={`${student.admissionNo} · ${student.course?.title ?? "No course assigned"}`}
      />

      <StudentTopRank
        studentId={student.id}
        studentName={user.name}
        courseId={student.courseId}
        courseTitle={student.course?.title ?? null}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Course" value={student.course?.title ?? "—"} icon={<GraduationCap className="h-5 w-5" />} tone="brand" />
        <StatCard label="Attendance" value={`${attendancePct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="blue" />
        <StatCard label="Admitted" value={formatDate(student.admissionDate)} icon={<CalendarDays className="h-5 w-5" />} tone="green" />
        <StatCard label="Status" value={student.status} icon={<GraduationCap className="h-5 w-5" />} tone="amber" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Your Teacher" subtitle={student.course?.title ?? undefined} />
        <div className="flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Users className="h-6 w-6" />
          </span>
          {teacher ? (
            <div>
              <p className="font-semibold text-slate-800">{teacher.user.name}</p>
              <p className="text-sm text-slate-500">{teacher.user.email}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not assigned yet.</p>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Notices"
          subtitle={`${notices.length} recent announcement${notices.length === 1 ? "" : "s"}`}
          action={<Link href="/student/notices" className="text-xs font-medium text-brand-600">View all</Link>}
        />
        <ul className="divide-y divide-slate-100">
          {notices.map((n) => (
            <li key={n.id} className="p-4">
              <p className="font-medium text-slate-800">{n.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
            </li>
          ))}
          {notices.length === 0 && <li className="p-8 text-center text-sm text-slate-400">No notices.</li>}
        </ul>
      </Card>
    </div>
  );
}
