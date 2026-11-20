import Link from "next/link";
import { connection } from "next/server";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { BarsChart } from "@/components/charts";
import { dateInputValue, formatCurrency, formatDate } from "@/lib/utils";
import { MONTHS, isOverdue, payableAmount } from "@/lib/challan";
import { buildFinanceReport, type MonthRow } from "@/lib/finance";

export const instant = false;

async function getStats() {
  await connection();
  const today = dateInputValue();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  const [
    thisYear,
    lastYear,
    unpaid,
    recentPayments,
    studentCount,
    teacherCount,
    courseCount,
    enquiryCount,
    recentEnquiries,
    recentNotices,
  ] = await Promise.all([
    buildFinanceReport(year),
    month < 6 ? buildFinanceReport(year - 1) : Promise.resolve(null),
    prisma.challan.findMany({
      where: { status: { not: "PAID" } },
      select: { amount: true, lateFee: true, paidAmount: true, status: true, dueDate: true },
    }),
    prisma.challan.findMany({
      where: { paidAmount: { gt: 0 } },
      orderBy: [{ paidDate: "desc" }, { updatedAt: "desc" }],
      take: 6,
      select: {
        id: true,
        challanNo: true,
        paidAmount: true,
        paidDate: true,
        updatedAt: true,
        student: { select: { admissionNo: true, user: { select: { name: true } } } },
      },
    }),
    prisma.student.count({ where: { exitReason: null } }),
    prisma.teacher.count(),
    prisma.course.count({ where: { active: true } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { course: true } }),
    prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const current = thisYear.months[month - 1];
  const previous: MonthRow | undefined =
    month > 1 ? thisYear.months[month - 2] : lastYear?.months[11];

  // Last 6 months, crossing into last year when needed.
  const months = [...(lastYear?.months ?? []), ...thisYear.months.slice(0, month)].slice(-6);
  const chart = months.map((m) => ({
    month: m.short,
    Collected: m.collected,
    Expenses: m.expenses,
  }));

  // Every unpaid challan, any month: what is still owed (late fee once overdue).
  const outstanding = unpaid.reduce((s, c) => s + Math.max(0, payableAmount(c) - c.paidAmount), 0);
  const overdue = unpaid.filter(isOverdue).length;

  const categories = Array.from(thisYear.expensesByCategory.get(current.key)?.entries() ?? []).sort(
    (a, b) => b[1] - a[1],
  );

  return {
    year,
    monthLabel: `${MONTHS[month - 1]} ${year}`,
    current,
    previous,
    ytd: thisYear.totals,
    chart,
    outstanding,
    overdue,
    unpaidCount: unpaid.length,
    categories,
    recentPayments,
    studentCount,
    teacherCount,
    courseCount,
    enquiryCount,
    recentEnquiries,
    recentNotices,
  };
}

function change(now: number, before: number | undefined) {
  if (before == null || before === 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export default async function AdminDashboard() {
  const s = await getStats();
  const collectedChange = change(s.current.collected, s.previous?.collected);
  const expenseChange = change(s.current.expenses, s.previous?.expenses);
  const loss = s.current.net < 0;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Finance overview · ${s.monthLabel}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/challans">
              <Button variant="secondary">Issue Challans</Button>
            </Link>
            <Link href="/admin/expenses">
              <Button variant="secondary">Add Expense</Button>
            </Link>
            <Link href="/admin/students">
              <Button>+ Add Student</Button>
            </Link>
          </div>
        }
      />

      {/* -------- This month -------- */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fees Collected"
          value={formatCurrency(s.current.collected)}
          hint={
            collectedChange == null
              ? `${s.current.paidCount} payments this month`
              : `${collectedChange >= 0 ? "▲" : "▼"} ${Math.abs(collectedChange)}% vs last month`
          }
          icon={<TrendingUp className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Expenses"
          value={formatCurrency(s.current.expenses)}
          hint={
            expenseChange == null
              ? `${s.current.expenseCount} entries this month`
              : `${expenseChange >= 0 ? "▲" : "▼"} ${Math.abs(expenseChange)}% vs last month`
          }
          icon={<TrendingDown className="h-5 w-5" />}
          tone="red"
        />
        <StatCard
          label={loss ? "Net Loss" : "Net Profit"}
          value={formatCurrency(s.current.net)}
          hint="Collected minus expenses"
          icon={<Wallet className="h-5 w-5" />}
          tone={loss ? "red" : "brand"}
        />
        <StatCard
          label="Outstanding Fees"
          value={formatCurrency(s.outstanding)}
          hint={`${s.unpaidCount} unpaid challan${s.unpaidCount === 1 ? "" : "s"} · ${s.overdue} overdue`}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {/* -------- Year to date -------- */}
      <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Collected in {s.year}</p>
          <p className="font-semibold text-emerald-600">{formatCurrency(s.ytd.collected)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expenses in {s.year}</p>
          <p className="font-semibold text-rose-600">{formatCurrency(s.ytd.expenses)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{s.ytd.net < 0 ? "Net loss" : "Net profit"} {s.year}</p>
          <p className={`font-semibold ${s.ytd.net < 0 ? "text-rose-600" : "text-slate-900"}`}>
            {formatCurrency(s.ytd.net)}
          </p>
        </div>
        <div className="flex items-center sm:justify-end">
          <Link href="/admin/reports" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Full monthly report →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Collected vs. Expenses" subtitle="Last 6 months" />
          <div className="p-4">
            <BarsChart
              data={s.chart}
              xKey="month"
              series={[
                { key: "Collected", color: "#10b981" },
                { key: "Expenses", color: "#f43f5e" },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Expenses by Category"
            subtitle={s.monthLabel}
            action={
              <Link href="/admin/expenses" className="text-xs font-medium text-brand-600">
                View all
              </Link>
            }
          />
          <div className="space-y-3 p-5">
            {s.categories.length === 0 && (
              <p className="text-sm text-slate-400">No expenses recorded this month.</p>
            )}
            {s.categories.slice(0, 6).map(([name, amount]) => {
              const pct = s.current.expenses ? Math.round((amount / s.current.expenses) * 100) : 0;
              return (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-500">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Fee Payments"
            action={
              <Link href="/admin/challans" className="text-xs font-medium text-brand-600">
                View all
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {s.recentPayments.length === 0 && (
              <p className="p-5 text-sm text-slate-400">No payments received yet.</p>
            )}
            {s.recentPayments.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{c.student.user.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {c.student.admissionNo} · {c.challanNo} · {formatDate(c.paidDate ?? c.updatedAt)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600">
                  {formatCurrency(c.paidAmount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Institute" />
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              { label: "Students", value: s.studentCount, icon: Users, href: "/admin/students" },
              { label: "Teachers", value: s.teacherCount, icon: GraduationCap, href: "/admin/teachers" },
              { label: "Active courses", value: s.courseCount, icon: BookOpen, href: "/admin/courses" },
              { label: "New enquiries", value: s.enquiryCount, icon: MessageSquare, href: "/admin/enquiries" },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <Icon className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </Link>
            ))}
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

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <Receipt className="h-3.5 w-3.5" /> Collected = fee money received in the month; outstanding = every
        unpaid challan, including the late fee once overdue.
      </p>
    </div>
  );
}
