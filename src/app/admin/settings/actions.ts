"use server";


import { guard } from "@/lib/safe-action";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export type PasswordState = { error?: string; success?: string };

async function changePassword__impl(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await requireUser("ADMIN");

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current || !next || !confirm) {
    return { error: "Please fill in all password fields." };
  }
  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "New passwords do not match." };
  }
  if (next === current) {
    return { error: "New password must be different from the current password." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return { error: "Account not found. Please sign in again." };
  }

  const valid = await bcrypt.compare(current, user.password);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(next, 10) },
  });

  revalidatePath("/admin/settings");
  return {
    success:
      "Password updated. Use the new password the next time you sign in.",
  };
}

async function updateSettings__impl(formData: FormData) {
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function changePassword(...args: Parameters<typeof changePassword__impl>) {
  return guard(() => changePassword__impl(...args));
}

export async function updateSettings(...args: Parameters<typeof updateSettings__impl>) {
  return guard(() => updateSettings__impl(...args));
}
