"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { parseDateInput } from "@/lib/utils";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/finance";

const MAX_AMOUNT = 100_000_000;

function backTo(target: FormDataEntryValue | null, key: string): string {
  const raw = String(target ?? "");
  // Only same-site expense pages, so "//evil.com" can't be used as a redirect.
  const safe =
    raw.startsWith("/admin/expenses") && !raw.startsWith("//") && !raw.includes("\\");
  const base = safe ? raw : "/admin/expenses";
  const clean = base.replace(/([?&])(added|deleted|error)=[^&]*/g, "$1").replace(/[?&]+$/, "");
  const sep = clean.includes("?") ? "&" : "?";
  return `${clean}${sep}${key}`;
}

export async function createExpense(formData: FormData) {
  await requireUser("ADMIN");

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const category = String(formData.get("category") ?? "");
  const amount = Math.round(Number(formData.get("amount") ?? 0) * 100) / 100;
  const date = String(formData.get("date") ?? "");
  const method = String(formData.get("paymentMethod") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  const back = formData.get("back");

  if (
    !title ||
    !(EXPENSE_CATEGORIES as readonly string[]).includes(category) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    redirect(backTo(back, "error=required"));
  }

  await prisma.expense.create({
    data: {
      title,
      category,
      amount,
      date: parseDateInput(date),
      paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(method) ? method : null,
      notes: notes || null,
    },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  redirect(backTo(back, "added=1"));
}

export async function deleteExpense(formData: FormData) {
  await requireUser("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.expense.deleteMany({ where: { id } });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  redirect(backTo(formData.get("back"), "deleted=1"));
}
