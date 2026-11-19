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
import { ConfirmDelete } from "@/components/confirm-delete";
import { FinanceTabs } from "@/components/finance-tabs";
import { MONTHS } from "@/lib/challan";
import { dateInputValue, formatCurrency, formatDate } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  monthKey,
  monthKeyOf,
  readMonth,
  readYear,
} from "@/lib/finance";
import { createExpense, deleteExpense } from "./actions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    category?: string;
    added?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  await connection();
  const sp = await searchParams;
  const today = dateInputValue();
  const year = readYear(sp.year);
  // Default to the current month; "all" shows the whole year.
  const month =
    sp.month === "all" ? null : (readMonth(sp.month) ?? Number(today.slice(5, 7)));
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(sp.category ?? "")
    ? (sp.category as string)
    : "";

  const all = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(Date.UTC(year - 1, 11, 31)),
        lt: new Date(Date.UTC(year + 1, 0, 2)),
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const ofYear = all.filter((e) => monthKeyOf(e.date).startsWith(`${year}-`));
  const ofPeriod = month
    ? ofYear.filter((e) => monthKeyOf(e.date) === monthKey(year, month))
    : ofYear;
  const shown = category ? ofPeriod.filter((e) => e.category === category) : ofPeriod;

  const periodTotal = ofPeriod.reduce((s, e) => s + e.amount, 0);
  const yearTotal = ofYear.reduce((s, e) => s + e.amount, 0);
  const shownTotal = shown.reduce((s, e) => s + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const e of ofPeriod) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  const categoryRows = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const top = categoryRows[0];

  const periodLabel = month ? `${MONTHS[month - 1]} ${year}` : `Year ${year}`;
  const nowYear = Number(today.slice(0, 4));
  const years = Array.from(
    new Set([nowYear - 2, nowYear - 1, nowYear, nowYear + 1, year]),
  ).sort();

  const qs = new URLSearchParams();
  qs.set("year", String(year));
  qs.set("month", month ? String(month) : "all");
  if (category) qs.set("category", category);
  const back = `/admin/expenses?${qs}`;
  const exportQs = new URLSearchParams({ year: String(year), month: month ? String(month) : "all" });
  if (category) exportQs.set("category", category);

  // New expenses default to today when viewing the current month, otherwise
  // to the 1st of the month being viewed.
  const defaultDate =
    month && monthKey(year, month) !== today.slice(0, 7)
      ? `${monthKey(year, month)}-01`
      : today;

  return (
    <div>
      <FinanceTabs active="expenses" />
      <PageHeader
        title="Expenses"
        subtitle={`Money spent by the institute · ${periodLabel}`}
        action={
          <div className="flex gap-2">
            <a
              href={`/api/export/expenses?${exportQs}&format=csv`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
            >
              Export CSV
            </a>
            <a
              href={`/api/export/expenses?${exportQs}&format=pdf`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
            >
              Export PDF
            </a>
          </div>
        }
      />

      {sp.error && (
        <Alert tone="error">Title, category, a positive amount and a date are required.</Alert>
      )}
      {sp.added === "1" && <Alert tone="success">Expense added.</Alert>}
      {sp.deleted === "1" && <Alert tone="success">Expense deleted.</Alert>}

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={month ? "This Month" : "This Year"}
          value={formatCurrency(periodTotal)}
          hint={periodLabel}
          tone="red"
        />
        <StatCard label="Entries" value={ofPeriod.length} hint={periodLabel} />
        <StatCard
          label="Biggest Category"
          value={top ? top[0] : "—"}
          hint={top ? formatCurrency(top[1]) : "No expenses yet"}
          tone="amber"
        />
        <StatCard
          label={`Total ${year}`}
          value={formatCurrency(yearTotal)}
          hint="All months of the year"
          tone="gray"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title="Add Expense" subtitle="Record a payment made by the institute" />
        <form action={createExpense} className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="back" value={back} />
          <Field label="Title" required>
            <Input name="title" placeholder="e.g. Office rent for November" maxLength={120} required />
          </Field>
          <Field label="Category" required>
            <Select name="category" defaultValue="" required>
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" required>
            <Input name="amount" type="number" min={1} step="any" placeholder="e.g. 25000" required />
          </Field>
          <Field label="Date" required>
            <Input name="date" type="date" defaultValue={defaultDate} required />
          </Field>
          <Field label="Paid by">
            <Select name="paymentMethod" defaultValue="Cash">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Input name="notes" placeholder="Optional (receipt no, paid to, …)" maxLength={500} />
          </Field>
          <div className="flex justify-end md:col-span-2 xl:col-span-3">
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`Expenses — ${periodLabel}`}
            subtitle={`${shown.length} entr${shown.length === 1 ? "y" : "ies"} · ${formatCurrency(shownTotal)}`}
            action={
              <form className="flex flex-wrap items-center gap-2" method="get">
                <Select name="month" defaultValue={month ? String(month) : "all"} className="!w-auto !py-1.5 text-xs">
                  <option value="all">All months</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </Select>
                <Select name="year" defaultValue={String(year)} className="!w-auto !py-1.5 text-xs">
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
                <Select name="category" defaultValue={category} className="!w-auto !py-1.5 text-xs">
                  <option value="">All categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="secondary">
                  Show
                </Button>
              </form>
            }
          />
          <Table head={["Date", "Expense", "Category", "Amount", ""]}>
            {shown.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(e.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{e.title}</p>
                  {(e.paymentMethod || e.notes) && (
                    <p className="text-xs text-slate-400">
                      {[e.paymentMethod, e.notes].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone="gray">{e.category}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-rose-600">
                  {formatCurrency(e.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmDelete
                    action={deleteExpense}
                    message={`Delete expense "${e.title}" (${formatCurrency(e.amount)})? This cannot be undone.`}
                    fields={
                      <>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="back" value={back} />
                      </>
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No expenses recorded for {periodLabel}
                  {category ? ` in ${category}` : ""}.
                </td>
              </tr>
            )}
          </Table>
        </Card>

        <Card>
          <CardHeader title="By Category" subtitle={periodLabel} />
          <div className="space-y-3 p-5">
            {categoryRows.length === 0 && (
              <p className="text-center text-sm text-slate-400">Nothing to show yet.</p>
            )}
            {categoryRows.map(([name, amount]) => {
              const pct = periodTotal ? Math.round((amount / periodTotal) * 100) : 0;
              return (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-500">
                      {formatCurrency(amount)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-right">
            <Link
              href={`/admin/reports?year=${year}${month ? `&month=${month}` : ""}`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              See monthly report →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
