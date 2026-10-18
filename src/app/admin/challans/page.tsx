import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
} from "@/components/ui";
import { formatCurrency, dateInputValue } from "@/lib/utils";
import {
  CHALLAN_STATUS_META,
  MONTHS,
  isOverdue,
  payableAmount,
} from "@/lib/challan";
import { createChallan, markChallanPaid } from "./actions";
import { FeeItems } from "@/components/fee-items";

const STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;

async function getData() {
  await connection();
  const [challans, students, courses] = await Promise.all([
    prisma.challan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: true, course: { select: { title: true } } } },
      },
    }),
    prisma.student.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: true, course: { select: { title: true } } },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);
  return { challans, students, courses };
}

const ERRORS: Record<string, string> = {
  required: "Student, month, year, at least one fee and due date are required.",
  student: "The selected student was not found.",
  number: "Could not generate a challan number. Please try again.",
};

export default async function ChallansPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    paid?: string;
    status?: string;
    course?: string;
  }>;
}) {
  const { challans, students, courses } = await getData();
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] : null;

  const statusFilter = (STATUSES as readonly string[]).includes(sp.status ?? "")
    ? sp.status!
    : "";
  const courseFilter = courses.some((c) => c.id === sp.course) ? sp.course! : "";

  const filtered = challans.filter(
    (c) =>
      (!statusFilter || c.status === statusFilter) &&
      (!courseFilter || c.student.courseId === courseFilter),
  );

  const outstanding = filtered.reduce(
    (acc, c) => acc + (c.status === "PAID" ? 0 : payableAmount(c)),
    0,
  );
  const collected = filtered.reduce((acc, c) => acc + c.paidAmount, 0);
  const overdueCount = filtered.filter(isOverdue).length;

  const now = new Date();
  const defaultDue = dateInputValue(new Date(Date.now() + 7 * 86400000));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const filterQuery = new URLSearchParams();
  if (statusFilter) filterQuery.set("status", statusFilter);
  if (courseFilter) filterQuery.set("course", courseFilter);

  return (
    <div>
      <PageHeader
        title="Fee Challans"
        subtitle={`${filtered.length} challan${filtered.length === 1 ? "" : "s"}`}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {sp.created === "1" && <Alert tone="success">Challan created successfully.</Alert>}
      {sp.paid === "1" && <Alert tone="success">Payment recorded — challan marked as paid.</Alert>}

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Challans" value={filtered.length} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          hint="Not yet received"
          tone="amber"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(collected)}
          hint="Total received"
          tone="green"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          hint="Past due date"
          tone="red"
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Issue New Challan"
          subtitle="Create a fee voucher for a student"
        />
        <form action={createChallan} className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Student">
              <Select name="studentId" defaultValue="" required>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} ({s.admissionNo}){s.course ? ` — ${s.course.title}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Month">
            <Select name="feeMonth" defaultValue={String(now.getMonth() + 1)} required>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Select name="feeYear" defaultValue={String(now.getFullYear())} required>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field
              label="Fees"
              hint="Pick each fee from the list (Monthly Fee, Admission Fee, ID Card Fee, Exam Fee, …) and enter its amount. Use + to add more."
            >
              <FeeItems />
            </Field>
          </div>
          <Field label="Due date">
            <Input name="dueDate" type="date" defaultValue={defaultDue} required />
          </Field>
          <Field
            label="Late fee"
            hint="Charged automatically if paid after the due date."
          >
            <Input
              name="lateFee"
              type="number"
              min={0}
              step="any"
              defaultValue={0}
              placeholder="e.g. 500"
            />
          </Field>
          <div className="flex items-end md:col-span-2 md:justify-end">
            <Button type="submit">Create Challan</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="All Challans"
          action={
            <form method="get" className="flex items-center gap-2">
              <Select
                name="status"
                defaultValue={statusFilter}
                className="w-auto py-1.5 text-xs"
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CHALLAN_STATUS_META[s].label}
                  </option>
                ))}
              </Select>
              <Select
                name="course"
                defaultValue={courseFilter}
                className="w-auto py-1.5 text-xs"
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" size="sm">Filter</Button>
              {filterQuery.toString() && (
                <Link
                  href="/admin/challans"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset
                </Link>
              )}
            </form>
          }
        />
        <Table head={["Student", "Particulars", "Amount", "Status", "Actions"]}>
          {filtered.map((c) => {
            const meta = CHALLAN_STATUS_META[c.status];
            const overdue = isOverdue(c);
            return (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.student.user.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.student.admissionNo}
                    {c.student.course ? ` · ${c.student.course.title}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.title}</td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {formatCurrency(c.amount)}
                  {c.lateFee > 0 && (
                    <p className="text-xs font-normal text-rose-500">
                      + {formatCurrency(c.lateFee)} late fee
                    </p>
                  )}
                  {c.paidAmount > 0 && (
                    <p className="text-xs font-normal text-emerald-600">
                      {formatCurrency(c.paidAmount)} received
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {overdue && <p className="mt-1 text-xs text-rose-500">Overdue</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.status !== "PAID" && (
                      <form action={markChallanPaid}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm">Mark as Paid</Button>
                      </form>
                    )}
                    <a
                      href={`/api/challan/${c.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                    >
                      Generate Challan
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                No challans yet. Issue one above to get started.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
