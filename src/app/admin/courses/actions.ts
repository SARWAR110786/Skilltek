"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function createCourse(formData: FormData) {
  await requireUser("ADMIN");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMonths = Number(formData.get("durationMonths") ?? 3) || 3;
  const teacherId = String(formData.get("teacherId") ?? "").trim();

  if (!title) redirect("/admin/courses?error=required");

  await prisma.course.create({
    data: {
      title,
      description: description || null,
      durationMonths,
      teacherId: teacherId || null,
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  redirect("/admin/courses?created=1");
}

export async function updateCourse(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) redirect("/admin/courses?error=required");

  await prisma.course.update({
    where: { id },
    data: {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      durationMonths: Number(formData.get("durationMonths") ?? 3) || 3,
      teacherId: String(formData.get("teacherId") ?? "").trim() || null,
      active: formData.get("active") != null,
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  redirect("/admin/courses?updated=1");
}

export async function deleteCourse(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
}
