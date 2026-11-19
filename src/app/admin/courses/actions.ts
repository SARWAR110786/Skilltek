"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { nextNumericCourseCode } from "@/lib/course-code";
import { parseDateInput } from "@/lib/utils";

/** Optional start / end dates; end must not be before start. */
function readDates(formData: FormData): { startDate: Date | null; endDate: Date | null } | null {
  const ok = (v: string) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v);
  const start = String(formData.get("startDate") ?? "").trim();
  const end = String(formData.get("endDate") ?? "").trim();
  if (!ok(start) || !ok(end)) return null;
  if (start && end && end < start) return null;
  return {
    startDate: start ? parseDateInput(start) : null,
    endDate: end ? parseDateInput(end) : null,
  };
}

async function nextCourseCode(): Promise<string> {
  const courses = await prisma.course.findMany({ select: { code: true } });
  return nextNumericCourseCode(courses.map((c) => c.code));
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
  const dates = readDates(formData);
  if (!dates) redirect("/admin/courses?error=dates");
  if (await titleExists(title)) {
    redirect("/admin/courses?error=title");
  }

  const code = await nextCourseCode();

  await prisma.course.create({
    data: {
      title,
      code,
      description,
      durationMonths: Math.trunc(durationMonths),
      ...dates,
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
  const dates = readDates(formData);
  if (!dates) redirect(`/admin/courses?edit=${id}&error=dates`);
  if (await titleExists(title, id)) {
    redirect("/admin/courses?error=title");
  }

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { code: true },
  });
  if (!existing) redirect("/admin/courses?error=required");

  const code = existing.code ?? (await nextCourseCode());

  await prisma.course.update({
    where: { id },
    data: {
      title,
      code,
      description,
      durationMonths: Math.trunc(durationMonths),
      ...dates,
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
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      _count: { select: { students: true, quizzes: true, assignments: true, assessments: true } },
    },
  });
  if (!course) return;
  // Deleting a course cascades to its quizzes/attempts and assignments/
  // submissions, and unlinks its students. Refuse while any exist.
  const c = course._count;
  if (c.students || c.quizzes || c.assignments || c.assessments) {
    redirect("/admin/courses?error=inuse");
  }
  await prisma.course.delete({ where: { id } });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
}
