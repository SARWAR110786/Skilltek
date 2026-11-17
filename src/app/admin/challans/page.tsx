import Link from "next/link";
import { connection } from "next/server";
import { Trash2 } from "lucide-react";
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
  monthName,
  payableAmount,
} from "@/lib/challan";
import { ConfirmDelete } from "@/components/confirm-delete";
import { StudentsAutoSearch } from "@/components/students-auto-search";
import { createChallan, deleteChallan, markChallanPaid } from "./actions";
import { FeeItems } from "@/components/fee-items";

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

type ChallanRow = Awaited<ReturnType<typeof getData>>["challans"][number];

type Period = { key: string; label: string; short: string };

function periodOf(c: ChallanRow): Period {
  const month = c.feeMonth ?? c.createdAt.getMonth() + 1;
  const year = c.feeYear ?? c.createdAt.getFullYear();
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${monthName(month - 1)} ${year}`,
    short: `${MONTHS[month - 1].slice(0, 3)} ${year}`,
  };
}

function groupByPeriod(challans: ChallanRow[]) {
  const groups = new Map<string, { period: Period; items: ChallanRow[] }>();
  for (const c of challans) {
    const period = periodOf(c);
    const group = groups.get(period.key);
    if (group) group.items.push(c);
    else groups.set(period.key, { period, items: [c] });
  }
  return Array.from(groups.values()).sort((a, b) =>
    b.period.key.localeCompare(a.period.key),
  );
}

const ERRORS: Record<string, string> = {
  required: "Student, month, year, at least one fee and due date are required.",
  student: "The selected student was not found.",
  inactive: "Dropout or passout students cannot be issued new challans.",
  number: "Could not generate a challan number. Please try again.",
};

export default async function ChallansPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    paid?: string;
    deleted?: string;
    q?: string;
    student?: string;
    view?: string;
  }>;
}) {
  const { challans, students, courses } = await getData();
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] : null;
  const query = (sp.q ?? "").trim();
  const search = query.toLowerCase();

  const selectedStudent = students.find((s) => s.id === sp.student) ?? null;
  const showAll = sp.view === "all";

  const filtered = challans.filter((c) => {
    if (!search) return true;
    const student = c.student;
    return (
      student.user.name.toLowerCase().includes(search) ||
      student.admissionNo.toLowerCase().includes(search)
    );
  });
  const scoped = selectedStudent
    ? filtered.filter((c) => c.studentId === selectedStudent.id)
    : filtered;

  const outstanding = scoped.reduce(
    (acc, c) => acc + (c.status === "PAID" ? 0 : payableAmount(c)),
    0,
  );
  const collected = scoped.reduce((acc, c) => acc + c.paidAmount, 0);
  const overdueCount = scoped.filter(isOverdue).length;

  const studentsWithChallans = students.filter((s) =>
    filtered.some((c) => c.studentId === s.id),
  );

  const now = new Date();
  const defaultDue = dateInputValue(new Date(Date.now() + 7 * 86400000));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const listQuery = new URLSearchParams();
  if (query) listQuery.set("q", query);
  const listHref = `/admin/challans${listQuery.toString() ? `?${listQuery}` : ""}`;
  const allQuery = new URLSearchParams(listQuery);
  allQuery.set("view", "all");
  const allHref = `/admin/challans?${allQuery}`;

  const grouped = groupByPeriod(scoped);
  const detailBack = showAll ? allHref : listHref;
  const detailQuery = new URLSearchParams(listQuery);
  if (selectedStudent) detailQuery.set("student", selectedStudent.id);
  const currentBack = selectedStudent
    ? `/admin/challans?${detailQuery}`
    : showAll
      ? allHref
      : listHref;

  function actionCell(c: ChallanRow) {
    return (
      <div className="flex min-w-[180px] flex-col items-stretch gap-2">
        {c.status !== "PAID" && (
          <form action={markChallanPaid}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="back" value={currentBack} />
            <Button type="submit" size="sm" className="w-full whitespace-nowrap">
              Mark as Paid
            </Button>
          </form>
        )}
        <a
          href={`/api/challan/${c.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="block whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-center text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
        >
          Generate Challan
        </a>
        <ConfirmDelete
          action={deleteChallan}
          message={`Delete challan ${c.challanNo} (${periodOf(c).label})? This cannot be undone.`}
          triggerClassName="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
          fields={
            <>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="back" value={currentBack} />
            </>
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </ConfirmDelete>
      </div>
    );
  }

  const searchBox = <StudentsAutoSearch defaultValue={query} />;

  return (
    <div>
      <PageHeader
        title="Fee Challans"
        subtitle={
          selectedStudent
            ? `${scoped.length} challan${scoped.length === 1 ? "" : "s"} for ${selectedStudent.user.name}`
            : `${studentsWithChallans.length} student${studentsWithChallans.length === 1 ? "" : "s"} with challans`
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {sp.created === "1" && <Alert tone="success">Challan created successfully.</Alert>}
      {sp.paid === "1" && <Alert tone="success">Payment recorded — challan marked as paid.</Alert>}
      {sp.deleted === "1" && <Alert tone="success">Challan deleted successfully.</Alert>}

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Challans" value={scoped.length} />
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
                {students.filter((s) => s.exitReason === null).map((s) => (
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

      {selectedStudent ? (
        <Card>
          <CardHeader
            title={`Challans — ${selectedStudent.user.name}`}
            subtitle={`${selectedStudent.admissionNo}${selectedStudent.course ? ` · ${selectedStudent.course.title}` : ""}`}
            action={
              <Link
                href={detailBack}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
              >
                ← Back to list
              </Link>
            }
          />
          {grouped.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              No challans found for this student with the current filters.
            </p>
          ) : (
            <div className="space-y-6 p-5">
              {grouped.map(({ period, items }) => (
                <div key={period.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">{period.label}</h3>
                    <Badge tone="gray">{items.length} challan{items.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <Table head={["Challan No", "Particulars", "Amount", "Status", <span key="actions" className="inline-block min-w-[180px]">Actions</span>]}>
                      {items.map((c) => {
                        const meta = CHALLAN_STATUS_META[c.status];
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.challanNo}</td>
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
                              {isOverdue(c) && <p className="mt-1 text-xs text-rose-500">Overdue</p>}
                            </td>
                            <td className="px-4 py-3">{actionCell(c)}</td>
                          </tr>
                        );
                      })}
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : showAll ? (
        <Card>
          <CardHeader title="All Challans" action={searchBox} />
          <Table head={["Student", "Particulars", "Amount", "Status", <span key="actions" className="inline-block min-w-[180px]">Actions</span>]}>
            {filtered.map((c) => {
              const meta = CHALLAN_STATUS_META[c.status];
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
                    {isOverdue(c) && <p className="mt-1 text-xs text-rose-500">Overdue</p>}
                  </td>
                  <td className="px-4 py-3">{actionCell(c)}</td>
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
      ) : (
        <Card>
          <CardHeader title="Students & Challans" action={searchBox} />
          <Table head={["Student", "Challans", "Outstanding", "Actions"]}>
            {studentsWithChallans.map((s) => {
              const own = filtered.filter((c) => c.studentId === s.id);
              const due = own.reduce(
                (acc, c) => acc + (c.status === "PAID" ? 0 : payableAmount(c)),
                0,
              );
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.user.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.admissionNo}{s.course ? ` · ${s.course.title}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{own.length}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(due)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/challans?student=${s.id}${listQuery.toString() ? `&${listQuery}` : ""}`}
                      className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                    >
                      View challans
                    </Link>
                  </td>
                </tr>
              );
            })}
            {studentsWithChallans.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  No students with challans yet. Issue one above to get started.
                </td>
              </tr>
            )}
          </Table>
          <div className="border-t border-slate-100 px-5 py-3 text-right">
            <Link
              href={allHref}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all challans →
            </Link>
          </div>
        </Card>
      )}

      {!selectedStudent && !showAll && (
        <p className="mt-3 text-xs text-slate-400">
          Tip: open a student to see every challan issued to them, grouped by month, with options to
          record payment, open the PDF or delete a challan.
        </p>
      )}
    </div>
  );
}
