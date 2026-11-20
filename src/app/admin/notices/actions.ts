"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function createNotice(formData: FormData) {
  const admin = await requireUser("ADMIN");
  const title = String(formData.get("title") ?? "").trim();
  // The form's field is "message" ("body" kept for older forms).
  const body = String(formData.get("message") ?? formData.get("body") ?? "").trim();
  const target = String(formData.get("target") ?? "ALL");
  const pinned = formData.get("pinned") === "on";

  if (!title || !body) redirect("/admin/notices?error=required");
  if (title.length > 150 || body.length > 5000) redirect("/admin/notices?error=long");

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
  revalidatePath("/student");
  revalidatePath("/student/notices");
  revalidatePath("/teacher");
  revalidatePath("/teacher/notices");
  redirect("/admin/notices?created=1");
}

export async function deleteNotice(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.notice.deleteMany({ where: { id } });
  revalidatePath("/admin/notices");
  revalidatePath("/admin");
  revalidatePath("/student");
  revalidatePath("/student/notices");
  revalidatePath("/teacher");
  revalidatePath("/teacher/notices");
  redirect("/admin/notices?deleted=1");
}
