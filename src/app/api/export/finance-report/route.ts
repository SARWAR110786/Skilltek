import { NextResponse } from "next/server";
import { csvResponse, getExportAuth, pdfResponse, type Cell } from "@/lib/export";
import { MONTHS } from "@/lib/challan";
import { formatDate } from "@/lib/utils";
import {
  buildFinanceReport,
  buildMonthDetail,
  monthKey,
  readMonth,
  readYear,
} from "@/lib/finance";

export async function GET(req: Request) {
  const user = await getExportAuth();
  // Institute finances: admins only.
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const year = readYear(searchParams.get("year"));
  const month = readMonth(searchParams.get("month"));
  const { months, totals } = await buildFinanceReport(year);

  // ---------- One month: every payment and expense, then the totals ----------
  if (searchParams.get("view") !== "year" && month) {
    const row = months[month - 1];
    const { payments, expenses } = await buildMonthDetail(year, month);
    const headers = ["Date", "Type", "Description", "Student / Category", "In (PKR)", "Out (PKR)"];
    const rows: Cell[][] = [
      ...payments.map((c): Cell[] => [
        formatDate(c.receivedOn),
        "Fee received",
        `${c.challanNo} · ${c.title}`,
        `${c.student.user.name} (${c.student.admissionNo})`,
        c.paidAmount,
        "",
      ]),
      ...expenses.map((e): Cell[] => [
        formatDate(e.date),
        "Expense",
        e.title,
        e.category,
        "",
        e.amount,
      ]),
      ["", "", "", "TOTAL", row.collected, row.expenses],
      ["", "", "", row.net < 0 ? "NET LOSS" : "NET PROFIT", row.net, ""],
      ["", "", "", "Still outstanding (this month's challans)", row.outstanding, ""],
    ];
    const label = `${MONTHS[month - 1]} ${year}`;
    const filename = `finance-report-${monthKey(year, month)}`;
    if (format === "pdf") {
      return pdfResponse(filename, {
        title: "SkillTek Institute · Monthly Finance Report",
        subtitle: `${label} · amounts in PKR`,
        headers,
        rows,
      });
    }
    return csvResponse(filename, [headers, ...rows]);
  }

  // ---------- Whole year: one row per month ----------
  const headers = [
    "Month",
    "Fees Billed",
    "Collected",
    "Outstanding",
    "Expenses",
    "Net (Collected - Expenses)",
  ];
  const rows: Cell[][] = months.map((m) => [
    `${m.label} ${year}`,
    m.billed,
    m.collected,
    m.outstanding,
    m.expenses,
    m.net,
  ]);
  rows.push([
    "TOTAL",
    totals.billed,
    totals.collected,
    totals.outstanding,
    totals.expenses,
    totals.net,
  ]);

  if (format === "pdf") {
    return pdfResponse(`finance-report-${year}`, {
      title: "SkillTek Institute · Yearly Finance Report",
      subtitle: `Year ${year} · amounts in PKR`,
      headers,
      rows,
    });
  }
  return csvResponse(`finance-report-${year}`, [headers, ...rows]);
}
