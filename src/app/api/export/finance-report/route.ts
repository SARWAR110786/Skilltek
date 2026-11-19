import { NextResponse } from "next/server";
import { csvResponse, getExportAuth, pdfResponse, type Cell } from "@/lib/export";
import { buildFinanceReport, readYear } from "@/lib/finance";

export async function GET(req: Request) {
  const user = await getExportAuth();
  // Institute finances: admins only.
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const year = readYear(searchParams.get("year"));
  const { months, totals } = await buildFinanceReport(year);

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
      title: "SkillTek Institute · Monthly Finance Report",
      subtitle: `Year ${year} · amounts in PKR`,
      headers,
      rows,
    });
  }
  return csvResponse(`finance-report-${year}`, [headers, ...rows]);
}
