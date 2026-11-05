"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { courseCodeFromTitle, normalizeCourseCode } from "@/lib/roll-number";

async function resolveCourseCode(
  title: string,
  rawCode: string,
  excludeId?: string,
): Promise<string> {
  const requested = normalizeCourseCode(rawCode);
  const base = requested || courseCodeFromTitle(title) || "GEN";
  let code = base;
  let suffix = 2;

  while (
    await prisma.course.findFirst({
      where: {
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    code = `${base.slice(0, 4)}${suffix}`;
    suffix += 1;
  }

  return code;
}

async function titleExists(title: string, excludeId?: string) {
  return Boolean(
    await prisma.course.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    }),
  );
}

export async function createCourse(formData: FormData) {
  await requireUser("ADMIN");
  const title = String(formData.get("title") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(formData.get("description") ?? "").trim();
  const durationMonths = Number(formData.get("durationMonths") ?? NaN);

  if (!title || title.length < 2 || title.length > 80) {
    redirect("/admin/courses?error=required");
  }
  if (!description || description.length < 5) {
    redirect("/admin/courses?error=required");
  }
  if (!Number.isFinite(durationMonths) || durationMonths < 1 || durationMonths > 60) {
    redirect("/admin/courses?error=required");
  }
  if (await titleExists(title)) {
    redirect("/admin/courses?error=title");
  }

  const code = await resolveCourseCode(
    title,
    String(formData.get("code") ?? ""),
  );

  await prisma.course.create({
    data: {
      title,
      code,
      description,
      durationMonths: Math.trunc(durationMonths),
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  redirect("/admin/courses?created=1");
}

export async function updateCourse(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(formData.get("description") ?? "").trim();
  const durationMonths = Number(formData.get("durationMonths") ?? NaN);

  if (!id || !title || title.length < 2 || title.length > 80) {
    redirect("/admin/courses?error=required");
  }
  if (!description || description.length < 5) {
    redirect("/admin/courses?error=required");
  }
  if (!Number.isFinite(durationMonths) || durationMonths < 1 || durationMonths > 60) {
    redirect("/admin/courses?error=required");
  }
  if (await titleExists(title, id)) {
    redirect("/admin/courses?error=title");
  }

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { code: true },
  });
  if (!existing) redirect("/admin/courses?error=required");

  const rawCode = String(formData.get("code") ?? "");
  const code = normalizeCourseCode(rawCode)
    ? await resolveCourseCode(title, rawCode, id)
    : existing.code ?? (await resolveCourseCode(title, "", id));

  await prisma.course.update({
    where: { id },
    data: {
      title,
      code,
      description,
      durationMonths: Math.trunc(durationMonths),
      teacherId: String(formData.get("teacherId") ?? "").trim() || null,
      active: formData.get("active") != null,
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/students");
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
