"use server";


import { guard } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const VALID = ["NEW", "CONTACTED", "ADMITTED", "CLOSED"] as const;
type Status = (typeof VALID)[number];

async function updateEnquiryStatus__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW") as Status;
  if (!id || !VALID.includes(status)) return;
  await prisma.enquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

async function deleteEnquiry__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.enquiry.delete({ where: { id } });
  revalidatePath("/admin/enquiries");
}

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function updateEnquiryStatus(...args: Parameters<typeof updateEnquiryStatus__impl>) {
  return guard(() => updateEnquiryStatus__impl(...args));
}

export async function deleteEnquiry(...args: Parameters<typeof deleteEnquiry__impl>) {
  return guard(() => deleteEnquiry__impl(...args));
}
