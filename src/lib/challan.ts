import type { ChallanStatus } from "@/generated/prisma/client";
import { todayStart } from "@/lib/utils";

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(" ");
}

/** 125000 -> "One Lakh Twenty-Five Thousand" (Indian/Pakistani numbering) */
export function numberToWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return "Zero";
  if (n >= 1000000000) return String(n);

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number, currency = "PKR"): string {
  const unit = currency === "PKR" ? "Rupees" : currency;
  return `${unit} ${numberToWords(amount)} Only`;
}

export function challanBalance(challan: {
  amount: number;
  paidAmount: number;
}): number {
  return Math.max(0, challan.amount - challan.paidAmount);
}

export const CHALLAN_STATUS_META: Record<
  ChallanStatus,
  { label: string; tone: "amber" | "blue" | "green" }
> = {
  UNPAID: { label: "Unpaid", tone: "amber" },
  PARTIAL: { label: "Partially Paid", tone: "blue" },
  PAID: { label: "Paid", tone: "green" },
};

export function isOverdue(challan: {
  status: ChallanStatus;
  dueDate: Date | string;
}): boolean {
  if (challan.status === "PAID") return false;
  const due =
    typeof challan.dueDate === "string"
      ? new Date(challan.dueDate)
      : challan.dueDate;
  return due.getTime() < todayStart().getTime();
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** 0-based month index -> "January" */
export function monthName(monthIndex: number): string {
  return MONTHS[((monthIndex % 12) + 12) % 12];
}

/** Human label for a challan's fee period, falling back to the issue date. */
export function feePeriodLabel(challan: {
  feeMonth?: number | null;
  feeYear?: number | null;
  createdAt: Date | string;
}): string {
  if (challan.feeMonth != null && challan.feeYear != null) {
    return `${monthName(challan.feeMonth - 1)} ${challan.feeYear}`;
  }
  const d =
    typeof challan.createdAt === "string"
      ? new Date(challan.createdAt)
      : challan.createdAt;
  return monthLabel(d);
}

export type ChallanItem = { label: string; amount: number };

/** Normalised fee line items for a challan (falls back to a single line). */
export function challanItems(challan: {
  items?: unknown;
  amount: number;
  title: string;
}): ChallanItem[] {
  if (Array.isArray(challan.items)) {
    const parsed = challan.items
      .map((raw) => {
        if (!raw || typeof raw !== "object") return null;
        const label = String((raw as { label?: unknown }).label ?? "").trim();
        const amount = Number((raw as { amount?: unknown }).amount ?? 0);
        if (!label || !Number.isFinite(amount) || amount <= 0) return null;
        return { label, amount };
      })
      .filter((x): x is ChallanItem => x !== null);
    if (parsed.length) return parsed;
  }
  return [{ label: challan.title, amount: challan.amount }];
}

/** Amount that should be collected: base fee plus any late fee once overdue. */
export function payableAmount(challan: {
  amount: number;
  lateFee: number;
  status: ChallanStatus;
  dueDate: Date | string;
}): number {
  return challan.amount + (isOverdue(challan) ? challan.lateFee : 0);
}

/** Next sequential challan number for the current year, e.g. CH-2026-0001 */
export async function nextChallanNo(): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;
  const last = await prisma.challan.findFirst({
    where: { challanNo: { startsWith: prefix } },
    orderBy: { challanNo: "desc" },
    select: { challanNo: true },
  });
  const seq = last ? Number(last.challanNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
