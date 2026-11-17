"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { parseDateInput } from "@/lib/utils";
import { monthName, nextChallanNo, payableAmount } from "@/lib/challan";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// Largest single fee line / late fee accepted (guards against typos like
// 1e400 = Infinity or an extra row of zeros).
const MAX_AMOUNT = 10_000_000;

function readAmount(value: FormDataEntryValue | null): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

function backWithMessage(target: string, key: string): string {
  // Only same-site admin paths, so "//evil.com" can't be used as a redirect.
  const safe =
    target.startsWith("/admin/") && !target.startsWith("//") && !target.includes("\\");
  const base = safe ? target : "/admin/challans";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=1`;
}

export async function createChallan(formData: FormData) {
  await requireUser("ADMIN");

  const studentId = String(formData.get("studentId") ?? "");
  const feeMonth = Number(formData.get("feeMonth") ?? 0);
  const feeYear = Number(formData.get("feeYear") ?? 0);
  const lateFee = readAmount(formData.get("lateFee"));
  const dueDate = String(formData.get("dueDate") ?? "");

  const labels = formData.getAll("feeLabel").map((v) => String(v).trim());
  const amounts = formData.getAll("feeAmount").map((v) => readAmount(v));
  const items: { label: string; amount: number }[] = [];
  for (let i = 0; i < Math.max(labels.length, amounts.length); i++) {
    const amount = amounts[i] ?? 0;
    if (amount <= 0) continue;
    const label = (labels[i] || "Fee").slice(0, 80);
    items.push({ label, amount });
  }
  const amount = items.reduce((sum, it) => sum + it.amount, 0);

  const validMonth = Number.isInteger(feeMonth) && feeMonth >= 1 && feeMonth <= 12;
  const validYear = Number.isInteger(feeYear) && feeYear >= 2000 && feeYear <= 2100;
  if (
    !studentId ||
    !validMonth ||
    !validYear ||
    items.length === 0 ||
    items.length > 20 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
  ) {
    redirect("/admin/challans?error=required");
  }
  if (lateFee > MAX_AMOUNT || items.some((it) => it.amount > MAX_AMOUNT)) {
    redirect("/admin/challans?error=required");
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    redirect("/admin/challans?error=student");
  }
  if (student.exitReason === "DROPOUT" || student.exitReason === "PASSOUT") {
    redirect("/admin/challans?error=inactive");
  }

  const title = `${items.map((it) => it.label).join(", ")} - ${monthName(feeMonth - 1)} ${feeYear}`;

  let created = false;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const challanNo = await nextChallanNo();
    try {
      await prisma.challan.create({
        data: {
          challanNo,
          studentId,
          title,
          feeMonth,
          feeYear,
          amount,
          items,
          lateFee,
          dueDate: parseDateInput(dueDate),
        },
      });
      created = true;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }

  if (!created) {
    redirect("/admin/challans?error=number");
  }

  revalidatePath("/admin/challans");
  revalidatePath("/student/challans");
  redirect("/admin/challans?created=1");
}

export async function markChallanPaid(formData: FormData) {
  await requireUser("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) return;
  // Already paid: keep the original paid date/amount instead of overwriting.
  if (challan.status === "PAID") {
    redirect(backWithMessage(String(formData.get("back") ?? ""), "paid"));
  }

  await prisma.challan.update({
    where: { id },
    data: {
      status: "PAID",
      paidAmount: payableAmount(challan),
      paidDate: new Date(),
      paymentMethod: challan.paymentMethod ?? "Cash",
    },
  });

  revalidatePath("/admin/challans");
  revalidatePath("/student/challans");
  redirect(backWithMessage(String(formData.get("back") ?? ""), "paid"));
}

export async function deleteChallan(formData: FormData) {
  await requireUser("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const challan = await prisma.challan.findUnique({ where: { id }, select: { challanNo: true } });
  if (!challan) return;

  await prisma.challan.delete({ where: { id } });

  revalidatePath("/admin/challans");
  revalidatePath("/student/challans");
  redirect(backWithMessage(String(formData.get("back") ?? ""), "deleted"));
}
