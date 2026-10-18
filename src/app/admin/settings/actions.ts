"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function updateSettings(formData: FormData) {
  await requireUser("ADMIN");
  const data = {
    instituteName: String(formData.get("instituteName") ?? "SkillTek").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    currency: String(formData.get("currency") ?? "PKR").trim(),
    bankName: String(formData.get("bankName") ?? "").trim() || null,
    bankBranch: String(formData.get("bankBranch") ?? "").trim() || null,
    bankAccountTitle: String(formData.get("bankAccountTitle") ?? "").trim() || null,
    bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim() || null,
    bankIban: String(formData.get("bankIban") ?? "").trim() || null,
    paymentInstructions:
      String(formData.get("paymentInstructions") ?? "").trim() || null,
  };

  await prisma.setting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/challans");
}
