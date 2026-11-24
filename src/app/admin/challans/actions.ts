"use server";


import { guard } from "@/lib/safe-action";
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

// Most challans generated in one go (one whole course at a time).
const MAX_BATCH = 500;

async function createChallan__impl(formData: FormData) {
  await requireUser("ADMIN");

  // Several students can be ticked at once; "studentId" is the old single field.
  const studentIds = Array.from(
    new Set(
      [...formData.getAll("studentIds"), ...formData.getAll("studentId")]
        .map((v) => String(v).trim())
        .filter(Boolean),
    ),
  );
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
    studentIds.length === 0 ||
    studentIds.length > MAX_BATCH ||
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

  const found = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, exitReason: true },
  });
  if (found.length === 0) {
    redirect("/admin/challans?error=student");
  }
  // Dropout / passout students never get new challans; skip them.
  const eligible = found.filter(
    (s) => s.exitReason !== "DROPOUT" && s.exitReason !== "PASSOUT",
  );
  if (eligible.length === 0) {
    redirect("/admin/challans?error=inactive");
  }
  const skipped = studentIds.length - eligible.length;

  const title = `${items.map((it) => it.label).join(", ")} - ${monthName(feeMonth - 1)} ${feeYear}`;
  const due = parseDateInput(dueDate);

  let created = 0;
  for (let attempt = 0; attempt < 3 && created === 0; attempt++) {
    // Reserve a run of sequential numbers starting from the next free one.
    const first = await nextChallanNo();
    const prefix = first.slice(0, first.lastIndexOf("-") + 1);
    const start = Number(first.slice(prefix.length));
    try {
      const result = await prisma.challan.createMany({
        data: eligible.map((s, i) => ({
          challanNo: `${prefix}${String(start + i).padStart(4, "0")}`,
          studentId: s.id,
          title,
          feeMonth,
          feeYear,
          amount,
          items,
          lateFee,
          dueDate: due,
        })),
      });
      created = result.count;
    } catch (e) {
      // Someone else took one of the numbers meanwhile: nothing was saved
      // (createMany is a single statement), so try again with fresh numbers.
      if (!isUniqueViolation(e)) throw e;
    }
  }

  if (created === 0) {
    redirect("/admin/challans?error=number");
  }

  revalidatePath("/admin/challans");
  revalidatePath("/student/challans");
  revalidatePath("/admin/reports");
  redirect(`/admin/challans?created=${created}${skipped ? `&skipped=${skipped}` : ""}`);
}

async function markChallanPaid__impl(formData: FormData) {
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

async function deleteChallan__impl(formData: FormData) {
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createChallan(...args: Parameters<typeof createChallan__impl>) {
  return guard(() => createChallan__impl(...args));
}

export async function markChallanPaid(...args: Parameters<typeof markChallanPaid__impl>) {
  return guard(() => markChallanPaid__impl(...args));
}

export async function deleteChallan(...args: Parameters<typeof deleteChallan__impl>) {
  return guard(() => deleteChallan__impl(...args));
}
