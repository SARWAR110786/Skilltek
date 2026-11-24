"use server";


import { guard } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { nextNumericCourseCode } from "@/lib/course-code";
import { parseDateInput } from "@/lib/utils";
import { MAX_COURSE_MONTHS, courseMonths } from "@/lib/course-duration";

/**
 * Start and end dates (both required). The duration in months is worked out
 * from them, so it always matches what the form showed.
 */
function readDates(
  formData: FormData,
): { startDate: Date; endDate: Date; durationMonths: number } | null {
  const start = String(formData.get("startDate") ?? "").trim();
  const end = String(formData.get("endDate") ?? "").trim();
  const months = courseMonths(start, end);
  if (months == null || months > MAX_COURSE_MONTHS) return null;
  return { startDate: parseDateInput(start), endDate: parseDateInput(end), durationMonths: months };
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

async function createCourse__impl(formData: FormData) {
  await requireUser("ADMIN");
  const title = String(formData.get("title") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(formData.get("description") ?? "").trim();

  if (!title || title.length < 2 || title.length > 80) {
    redirect("/admin/courses?error=required");
  }
  if (!description || description.length < 5) {
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
      ...dates,
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  redirect("/admin/courses?created=1");
}

async function updateCourse__impl(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const description = String(formData.get("description") ?? "").trim();

  if (!id || !title || title.length < 2 || title.length > 80) {
    redirect("/admin/courses?error=required");
  }
  if (!description || description.length < 5) {
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

async function deleteCourse__impl(formData: FormData) {
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function createCourse(...args: Parameters<typeof createCourse__impl>) {
  return guard(() => createCourse__impl(...args));
}

export async function updateCourse(...args: Parameters<typeof updateCourse__impl>) {
  return guard(() => updateCourse__impl(...args));
}

export async function deleteCourse(...args: Parameters<typeof deleteCourse__impl>) {
  return guard(() => deleteCourse__impl(...args));
}
