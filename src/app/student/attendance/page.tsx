import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Badge, Button, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { CalendarCheck } from "lucide-react";
import { formatDate, percent } from "@/lib/utils";

async function getAttendance(studentId: string, offset: number) {
  await connection();
  return prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
    skip: offset,
    take: 20,
  });
}

async function countAttendance(studentId: string) {
  await connection();
  return prisma.attendance.count({ where: { studentId } });
}

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const take = 20;
  const offset = (page - 1) * take;

  if (!student) {
    return <Card><p className="p-10 text-center text-sm text-slate-500">Your student profile is not set up yet. Please contact the administration.</p></Card>;
  }

  const [records, total, all] = await Promise.all([
    getAttendance(student.id, offset),
    countAttendance(student.id),
    prisma.attendance.findMany({ where: { studentId: student.id }, select: { status: true } }),
  ]);
  const present = all.filter((r) => r.status === "PRESENT").length;
  const pct = percent(present, all.length);
  const totalPages = Math.max(1, Math.ceil(total / take));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div>
      <PageHeader title="Attendance" subtitle={`${total} record${total === 1 ? "" : "s"}`} />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Attendance" value={`${pct}%`} icon={<CalendarCheck className="h-5 w-5" />} tone="green" />
        <StatCard label="Present" value={present} icon={<CalendarCheck className="h-5 w-5" />} tone="brand" />
        <StatCard label="Absent" value={all.length - present} icon={<CalendarCheck className="h-5 w-5" />} tone="red" />
      </div>

      <Card>
        <CardHeader title="History" subtitle={`Page ${page} of ${totalPages}`} />
        <Table head={["Date", "Status"]}>
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-700">{formatDate(r.date)}</td>
              <td className="px-4 py-3">
                <Badge tone={r.status === "PRESENT" ? "green" : "red"}>{r.status}</Badge>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr><td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-400">No attendance records yet.</td></tr>
          )}
        </Table>
        {total > take && (
          <div className="flex items-center justify-between px-4 py-3">
            {canPrev ? (
              <Link href={`/student/attendance?page=${page - 1}`}>
                <Button variant="secondary">Previous</Button>
              </Link>
            ) : (
              <div />
            )}
            {canNext ? (
              <Link href={`/student/attendance?page=${page + 1}`}>
                <Button variant="secondary">Next</Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
