import Link from "next/link";
import { connection } from "next/server";
import { Badge, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { BarsChart } from "@/components/charts";
import { FinanceTabs } from "@/components/finance-tabs";
import { ReportFilter } from "@/components/report-filter";
import { cn, dateInputValue, formatCurrency, formatDate } from "@/lib/utils";
import {
  buildFinanceReport,
  buildMonthDetail,
  financeYears,
  readMonth,
  readYear,
} from "@/lib/finance";

function Money({ value, tone }: { value: number; tone?: "green" | "red" | "net" }) {
  const color =
    tone === "green"
      ? "text-emerald-600"
      : tone === "red"
        ? "text-rose-600"
        : tone === "net"
          ? value < 0
            ? "text-rose-600"
            : "text-emerald-700"
          : "text-slate-700";
  return <span className={cn("whitespace-nowrap", color)}>{formatCurrency(value)}</span>;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string; month?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const today = dateInputValue();
  const nowYear = Number(today.slice(0, 4));
  const year = readYear(sp.year);
  const month = readMonth(sp.month) ?? (year === nowYear ? Number(today.slice(5, 7)) : 12);

  const view: "year" | "month" = sp.view === "year" ? "year" : "month";

  const [report, detail] = await Promise.all([
    buildFinanceReport(year),
    view === "month" ? buildMonthDetail(year, month) : null,
  ]);
  const selected = report.months[month - 1];
  const categories = Array.from(report.expensesByCategory.get(selected.key)?.entries() ?? []).sort(
    (a, b) => b[1] - a[1],
  );
  const years = financeYears(year);

  const chartData = report.months.map((m) => ({
    month: m.short,
    Collected: m.collected,
    Expenses: m.expenses,
  }));

  const exportQs = `view=${view}&year=${year}&month=${month}`;
  const exportLinks = (
    <>
      <a
        href={`/api/export/finance-report?${exportQs}&format=csv`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
      >
        Export CSV
      </a>
      <a
        href={`/api/export/finance-report?${exportQs}&format=pdf`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
      >
        Export PDF
      </a>
    </>
  );
  const header = (
    <PageHeader
      title={view === "month" ? "Monthly Finance Report" : "Yearly Finance Report"}
      subtitle={
        view === "month"
          ? `Fees received vs. expenses in ${selected.label} ${year}`
          : `Fees received vs. expenses for every month of ${year}`
      }
      action={
        <div className="flex flex-wrap items-center gap-2">
          <ReportFilter view={view} year={year} month={month} years={years} />
          {exportLinks}
        </div>
      }
    />
  );

  if (view === "month" && detail) {
    return (
      <div>
        <FinanceTabs active="reports" />
        {header}

        <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Fees Collected"
            value={formatCurrency(selected.collected)}
            hint={`${selected.paidCount} payment${selected.paidCount === 1 ? "" : "s"} received`}
            tone="green"
          />
          <StatCard
            label="Expenses"
            value={formatCurrency(selected.expenses)}
            hint={`${selected.expenseCount} entr${selected.expenseCount === 1 ? "y" : "ies"}`}
            tone="red"
          />
          <StatCard
            label={selected.net < 0 ? "Net Loss" : "Net Profit"}
            value={formatCurrency(selected.net)}
            hint="Collected minus expenses"
            tone={selected.net < 0 ? "red" : "brand"}
          />
          <StatCard
            label="Still Outstanding"
            value={formatCurrency(selected.outstanding)}
            hint={`Billed ${formatCurrency(selected.billed)} on ${selected.challanCount} challan${selected.challanCount === 1 ? "" : "s"}`}
            tone="amber"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader
              title="Fees Received"
              subtitle={`${detail.payments.length} payment${detail.payments.length === 1 ? "" : "s"} · ${formatCurrency(selected.collected)}`}
            />
            <Table head={["Date", "Student", "Challan", "Amount"]}>
              {detail.payments.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(c.receivedOn)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.student.user.name}</p>
                    <p className="text-xs text-slate-400">
                      {c.student.admissionNo}
                      {c.student.course ? ` · ${c.student.course.title}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-600">{c.challanNo}</p>
                    {c.paymentMethod && (
                      <p className="text-xs text-slate-400">{c.paymentMethod}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Money value={c.paidAmount} tone="green" />
                  </td>
                </tr>
              ))}
              {detail.payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    No fee payments received in {selected.label} {year}.
                  </td>
                </tr>
              )}
            </Table>
          </Card>

          <Card>
            <CardHeader
              title="Expenses"
              subtitle={`${detail.expenses.length} entr${detail.expenses.length === 1 ? "y" : "ies"} · ${formatCurrency(selected.expenses)}`}
              action={
                <Link
                  href={`/admin/expenses?year=${year}&month=${month}`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Add / manage →
                </Link>
              }
            />
            <Table head={["Date", "Expense", "Category", "Amount"]}>
              {detail.expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(e.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{e.title}</p>
                    {e.paymentMethod && (
                      <p className="text-xs text-slate-400">{e.paymentMethod}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="gray">{e.category}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Money value={e.amount} tone="red" />
                  </td>
                </tr>
              ))}
              {detail.expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    No expenses recorded in {selected.label} {year}.
                  </td>
                </tr>
              )}
            </Table>
            {categories.length > 0 && (
              <div className="border-t border-slate-100 p-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">By category</h4>
                <ul className="space-y-2 text-sm">
                  {categories.map(([name, amount]) => (
                    <li key={name} className="flex justify-between">
                      <span className="text-slate-600">{name}</span>
                      <Money value={amount} tone="red" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Fees received = money recorded as paid during this month. Outstanding = unpaid amount on
          challans issued for {selected.label} {year}. Net = received − expenses.
        </p>
      </div>
    );
  }

  return (
    <div>
      <FinanceTabs active="reports" />
      {header}

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Fees Collected ${year}`}
          value={formatCurrency(report.totals.collected)}
          hint={`${report.totals.paidCount} payments received`}
          tone="green"
        />
        <StatCard
          label={`Expenses ${year}`}
          value={formatCurrency(report.totals.expenses)}
          hint={`${report.totals.expenseCount} entries`}
          tone="red"
        />
        <StatCard
          label={report.totals.net < 0 ? "Net Loss" : "Net Profit"}
          value={formatCurrency(report.totals.net)}
          hint="Collected minus expenses"
          tone={report.totals.net < 0 ? "red" : "brand"}
        />
        <StatCard
          label="Still Outstanding"
          value={formatCurrency(report.totals.outstanding)}
          hint={`Unpaid on ${year} challans`}
          tone="amber"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title="Collected vs. Expenses" subtitle={`Month by month, ${year}`} />
        <div className="p-5">
          <BarsChart
            data={chartData}
            xKey="month"
            series={[
              { key: "Collected", color: "#10b981" },
              { key: "Expenses", color: "#f43f5e" },
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`All Months — ${year}`}
            subtitle="Click a month to open its monthly report"
          />
          <Table
            head={["Month", "Fees Billed", "Collected", "Outstanding", "Expenses", "Net"]}
          >
            {report.months.map((m) => (
              <tr
                key={m.key}
                className={cn("hover:bg-slate-50", m.month === month && "bg-brand-50/60")}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/reports?view=month&year=${year}&month=${m.month}`}
                    className="font-medium text-slate-800 hover:text-brand-600"
                  >
                    {m.label}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Money value={m.billed} />
                </td>
                <td className="px-4 py-3">
                  <Money value={m.collected} tone="green" />
                </td>
                <td className="px-4 py-3">
                  <Money value={m.outstanding} />
                </td>
                <td className="px-4 py-3">
                  <Money value={m.expenses} tone="red" />
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Money value={m.net} tone="net" />
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <td className="px-4 py-3 text-slate-800">Total</td>
              <td className="px-4 py-3">
                <Money value={report.totals.billed} />
              </td>
              <td className="px-4 py-3">
                <Money value={report.totals.collected} tone="green" />
              </td>
              <td className="px-4 py-3">
                <Money value={report.totals.outstanding} />
              </td>
              <td className="px-4 py-3">
                <Money value={report.totals.expenses} tone="red" />
              </td>
              <td className="px-4 py-3">
                <Money value={report.totals.net} tone="net" />
              </td>
            </tr>
          </Table>
        </Card>

        <Card>
          <CardHeader title={`${selected.label} ${year}`} subtitle="Month summary" />
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ["Fees billed", <Money key="b" value={selected.billed} />, `${selected.challanCount} challans`],
              ["Fees collected", <Money key="c" value={selected.collected} tone="green" />, `${selected.paidCount} payments`],
              ["Still outstanding", <Money key="o" value={selected.outstanding} />, "on this month's challans"],
              ["Expenses", <Money key="e" value={selected.expenses} tone="red" />, `${selected.expenseCount} entries`],
            ].map(([label, value, hint]) => (
              <div key={String(label)} className="flex items-center justify-between px-5 py-3">
                <div>
                  <dt className="font-medium text-slate-700">{label}</dt>
                  <p className="text-xs text-slate-400">{hint}</p>
                </div>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
              <dt className="font-semibold text-slate-800">
                {selected.net < 0 ? "Net loss" : "Net profit"}
              </dt>
              <dd className="text-lg font-bold">
                <Money value={selected.net} tone="net" />
              </dd>
            </div>
          </dl>
          <div className="border-t border-slate-100 p-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Expenses by category</h4>
            {categories.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses recorded this month.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {categories.map(([name, amount]) => (
                  <li key={name} className="flex justify-between">
                    <span className="text-slate-600">{name}</span>
                    <Money value={amount} tone="red" />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/admin/expenses?year=${year}&month=${month}`}
              className="mt-4 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View {selected.label} expenses →
            </Link>
          </div>
        </Card>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Collected = money received in that month (by payment date). Fees billed and outstanding
        follow each challan&apos;s fee month. Net = collected − expenses.
      </p>
    </div>
  );
}
