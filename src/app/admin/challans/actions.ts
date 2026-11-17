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

function backWithMessage(target: string, key: string): string {
  const base = target.startsWith("/") ? target : "/admin/challans";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=1`;
}

export async function createChallan(formData: FormData) {
  await requireUser("ADMIN");

  const studentId = String(formData.get("studentId") ?? "");
  const feeMonth = Number(formData.get("feeMonth") ?? 0);
  const feeYear = Number(formData.get("feeYear") ?? 0);
  const lateFee = Math.max(0, Number(formData.get("lateFee") ?? 0) || 0);
  const dueDate = String(formData.get("dueDate") ?? "");

  const labels = formData.getAll("feeLabel").map((v) => String(v).trim());
  const amounts = formData.getAll("feeAmount").map((v) => Number(v) || 0);
  const items: { label: string; amount: number }[] = [];
  for (let i = 0; i < Math.max(labels.length, amounts.length); i++) {
    const amount = amounts[i] ?? 0;
    if (amount <= 0) continue;
    const label = labels[i] || "Fee";
    items.push({ label, amount });
  }
  const amount = items.reduce((sum, it) => sum + it.amount, 0);

  const validMonth = feeMonth >= 1 && feeMonth <= 12;
  if (!studentId || !validMonth || !feeYear || items.length === 0 || !dueDate) {
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
