import { prisma } from "@/lib/prisma";
import { MONTHS } from "@/lib/challan";
import { dateInputValue } from "@/lib/utils";

/** Suggested expense categories (an expense can only use one of these). */
export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Electricity",
  "Gas & Water",
  "Internet & Phone",
  "Stationery & Printing",
  "Equipment",
  "Repairs & Maintenance",
  "Marketing",
  "Transport",
  "Refreshments",
  "Other",
] as const;

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online / Wallet"] as const;

/** "YYYY-MM" of an instant, as a Pakistan calendar month. */
export function monthKeyOf(d: Date): string {
  return dateInputValue(d).slice(0, 7);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Start/end instants wide enough to cover every PKT day of a year (with slack). */
function yearWindow(year: number) {
  return {
    gte: new Date(Date.UTC(year - 1, 11, 31)),
    lt: new Date(Date.UTC(year + 1, 0, 2)),
  };
}

export type MonthRow = {
  month: number; // 1-12
  key: string; // YYYY-MM
  label: string; // "January"
  short: string; // "Jan"
  billed: number; // challans issued for this fee month
  collected: number; // money received during this month
  outstanding: number; // unpaid amount of this month's challans
  expenses: number;
  net: number; // collected - expenses
  challanCount: number;
  paidCount: number;
  expenseCount: number;
};

export type FinanceReport = {
  year: number;
  months: MonthRow[];
  totals: Omit<MonthRow, "month" | "key" | "label" | "short">;
  expensesByCategory: Map<string, Map<string, number>>; // key -> category -> amount
};

/**
 * Income vs expenses for every month of a year.
 *  - Billed / outstanding use the challan's fee month (falls back to issue date).
 *  - Collected uses the date the payment was recorded (cash received that month).
 *  - Expenses use the expense date.
 */
export async function buildFinanceReport(year: number): Promise<FinanceReport> {
  const window = yearWindow(year);
  const [challans, paid, expenses] = await Promise.all([
    prisma.challan.findMany({
      where: {
        OR: [{ feeYear: year }, { feeYear: null, createdAt: window }],
      },
      select: {
        amount: true,
        paidAmount: true,
        status: true,
        feeMonth: true,
        feeYear: true,
        createdAt: true,
      },
    }),
    prisma.challan.findMany({
      where: {
        paidAmount: { gt: 0 },
        OR: [{ paidDate: window }, { paidDate: null, updatedAt: window }],
      },
      select: { paidAmount: true, paidDate: true, updatedAt: true },
    }),
    prisma.expense.findMany({
      where: { date: window },
      select: { amount: true, date: true, category: true },
    }),
  ]);

  const months: MonthRow[] = MONTHS.map((label, i) => ({
    month: i + 1,
    key: monthKey(year, i + 1),
    label,
    short: label.slice(0, 3),
    billed: 0,
    collected: 0,
    outstanding: 0,
    expenses: 0,
    net: 0,
    challanCount: 0,
    paidCount: 0,
    expenseCount: 0,
  }));
  const byKey = new Map(months.map((m) => [m.key, m]));
  const expensesByCategory = new Map<string, Map<string, number>>();

  for (const c of challans) {
    const key =
      c.feeMonth != null && c.feeYear != null
        ? monthKey(c.feeYear, c.feeMonth)
        : monthKeyOf(c.createdAt);
    const row = byKey.get(key);
    if (!row) continue;
    row.billed += c.amount;
    row.challanCount += 1;
    if (c.status !== "PAID") row.outstanding += Math.max(0, c.amount - c.paidAmount);
  }

  for (const c of paid) {
    const row = byKey.get(monthKeyOf(c.paidDate ?? c.updatedAt));
    if (!row) continue;
    row.collected += c.paidAmount;
    row.paidCount += 1;
  }

  for (const e of expenses) {
    const key = monthKeyOf(e.date);
    const row = byKey.get(key);
    if (!row) continue;
    row.expenses += e.amount;
    row.expenseCount += 1;
    const cats = expensesByCategory.get(key) ?? new Map<string, number>();
    cats.set(e.category, (cats.get(e.category) ?? 0) + e.amount);
    expensesByCategory.set(key, cats);
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const totals = {
    billed: 0,
    collected: 0,
    outstanding: 0,
    expenses: 0,
    net: 0,
    challanCount: 0,
    paidCount: 0,
    expenseCount: 0,
  };
  for (const m of months) {
    m.billed = round(m.billed);
    m.collected = round(m.collected);
    m.outstanding = round(m.outstanding);
    m.expenses = round(m.expenses);
    m.net = round(m.collected - m.expenses);
    totals.billed += m.billed;
    totals.collected += m.collected;
    totals.outstanding += m.outstanding;
    totals.expenses += m.expenses;
    totals.challanCount += m.challanCount;
    totals.paidCount += m.paidCount;
    totals.expenseCount += m.expenseCount;
  }
  totals.billed = round(totals.billed);
  totals.collected = round(totals.collected);
  totals.outstanding = round(totals.outstanding);
  totals.expenses = round(totals.expenses);
  totals.net = round(totals.collected - totals.expenses);

  return { year, months, totals, expensesByCategory };
}

/** Year from a query string, defaulting to the current PKT year. */
export function readYear(value: string | null | undefined): number {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 2000 && n <= 2100) return n;
  return Number(dateInputValue().slice(0, 4));
}

/** Month (1-12) from a query string, or null. */
export function readMonth(value: string | null | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}
