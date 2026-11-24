"use server";


import { guard } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

async function createNotice__impl(formData: FormData) {
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
  revalidatePath("/");
  revalidatePath("/student");
  revalidatePath("/student/notices");
  revalidatePath("/teacher");
  revalidatePath("/teacher/notices");
  redirect("/admin/notices?created=1");
}

async function deleteNotice__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.notice.deleteMany({ where: { id } });
  revalidatePath("/admin/notices");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/student");
  revalidatePath("/student/notices");
  revalidatePath("/teacher");
  revalidatePath("/teacher/notices");
  redirect("/admin/notices?deleted=1");
}

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createNotice(...args: Parameters<typeof createNotice__impl>) {
  return guard(() => createNotice__impl(...args));
}

export async function deleteNotice(...args: Parameters<typeof deleteNotice__impl>) {
  return guard(() => deleteNotice__impl(...args));
}
