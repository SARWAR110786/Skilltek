import Link from "next/link";
import { connection } from "next/server";
import { BookOpen, GraduationCap, MessageSquare, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, Card, CardHeader, PageHeader, StatCard, Badge } from "@/components/ui";
import { TrendChart } from "@/components/charts";
import { formatDate } from "@/lib/utils";

export const instant = false;

async function getStats() {
  await connection();
  const [studentCount, teacherCount, courseCount, enquiryCount, admissionRows, recentEnquiries, recentNotices] =
    await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.course.count(),
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.student.findMany({
        select: { admissionDate: true },
        orderBy: { admissionDate: "asc" },
      }),
      prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { course: true } }),
      prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const months = buildMonths(6);
  const admissionTrend = months.map((m) => ({
    month: m.label,
    admissions: admissionRows.filter((r) => m.match(r.admissionDate)).length,
  }));

  return { studentCount, teacherCount, courseCount, enquiryCount, admissionTrend, recentEnquiries, recentNotices };
}

function buildMonths(n: number) {
  const now = new Date();
  const out: { label: string; match: (d: Date) => boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    out.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      match: (x) => x >= start && x < end,
    });
  }
  return out;
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of your institute"
        action={
          <Link href="/admin/students">
            <Button>+ Add Student</Button>
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={s.studentCount} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Teachers" value={s.teacherCount} icon={<GraduationCap className="h-5 w-5" />} tone="blue" />
        <StatCard label="Courses" value={s.courseCount} icon={<BookOpen className="h-5 w-5" />} tone="green" />
        <StatCard label="New Enquiries" value={s.enquiryCount} icon={<MessageSquare className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader title="Admissions Trend" subtitle="New students per month" />
          <div className="p-4">
            <TrendChart
              data={s.admissionTrend}
              xKey="month"
              series={[{ key: "admissions", color: "#6366f1", label: "Admissions" }]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Enquiries"
            action={<Link href="/admin/enquiries" className="text-xs font-medium text-brand-600">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {s.recentEnquiries.length === 0 && (
              <p className="p-5 text-sm text-slate-400">No enquiries yet.</p>
            )}
            {s.recentEnquiries.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{e.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {e.course?.title ?? e.phone ?? e.email ?? "—"}
                  </p>
                </div>
                <Badge tone={e.status === "NEW" ? "amber" : e.status === "ADMITTED" ? "green" : "gray"}>
                  {e.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Notices"
            action={<Link href="/admin/notices" className="text-xs font-medium text-brand-600">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {s.recentNotices.length === 0 && (
              <p className="p-5 text-sm text-slate-400">No notices yet.</p>
            )}
            {s.recentNotices.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <p className="truncate text-sm font-medium text-slate-700">{n.title}</p>
                <p className="text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
