"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const VALID = ["NEW", "CONTACTED", "ADMITTED", "CLOSED"] as const;
type Status = (typeof VALID)[number];

export async function updateEnquiryStatus(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW") as Status;
  if (!id || !VALID.includes(status)) return;
  await prisma.enquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}

export async function deleteEnquiry(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.enquiry.delete({ where: { id } });
  revalidatePath("/admin/enquiries");
}
