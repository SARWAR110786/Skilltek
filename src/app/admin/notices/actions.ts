"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function createNotice(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const target = String(formData.get("target") ?? "ALL");
  const pinned = formData.get("pinned") === "on";

  if (!title || !body) redirect("/admin/notices?error=required");

  await prisma.notice.create({
    data: {
      title,
      body,
      target: (["ALL", "TEACHERS", "STUDENTS"].includes(target)
        ? target
        : "ALL") as "ALL" | "TEACHERS" | "STUDENTS",
      pinned,
      createdById: admin.id,
    },
  });
  revalidatePath("/admin/notices");
  revalidatePath("/admin");
}

export async function deleteNotice(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.notice.delete({ where: { id } });
  revalidatePath("/admin/notices");
  revalidatePath("/admin");
}
