import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvResponse, getExportAuth, pdfResponse, type Cell } from "@/lib/export";
import { MONTHS } from "@/lib/challan";
import { formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES, monthKey, monthKeyOf, readMonth, readYear } from "@/lib/finance";

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
  const rawCategory = searchParams.get("category") || "";
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(rawCategory)
    ? rawCategory
    : "";

  const all = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(Date.UTC(year - 1, 11, 31)),
        lt: new Date(Date.UTC(year + 1, 0, 2)),
      },
      ...(category ? { category } : {}),
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  const expenses = all.filter((e) => {
    const key = monthKeyOf(e.date);
    return month ? key === monthKey(year, month) : key.startsWith(`${year}-`);
  });
  const total = Math.round(expenses.reduce((s, e) => s + e.amount, 0) * 100) / 100;

  const headers = ["Date", "Expense", "Category", "Amount (PKR)", "Paid By", "Notes"];
  const rows: Cell[][] = expenses.map((e) => [
    formatDate(e.date),
    e.title,
    e.category,
    e.amount,
    e.paymentMethod ?? "",
    e.notes ?? "",
  ]);
  rows.push(["", "TOTAL", "", total, "", ""]);

  const period = month ? `${MONTHS[month - 1]} ${year}` : `Year ${year}`;
  const filename = `expenses-${month ? monthKey(year, month) : year}`;
  if (format === "pdf") {
    return pdfResponse(filename, {
      title: "SkillTek Institute · Expenses",
      subtitle: `${period}${category ? ` · ${category}` : ""}`,
      headers,
      rows,
    });
  }
  return csvResponse(filename, [headers, ...rows]);
}
