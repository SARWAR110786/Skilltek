"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { readMonth, readYear } from "@/lib/finance";
import {
  PUBLISH_COUNT,
  groupByCourse,
  monthlyPerformance,
  parsePublished,
  type PublishedCourse,
} from "@/lib/performance";

function back(year: number, month: number | null, course: string, flag: string) {
  const qs = new URLSearchParams({ year: String(year) });
  if (month) qs.set("month", String(month));
  if (course) qs.set("course", course);
  return `/admin/performance?${qs}&${flag}`;
}

async function currentCourses(): Promise<PublishedCourse[]> {
  const live = await prisma.topStudentsPublication.findUnique({ where: { id: "current" } });
  return live ? parsePublished(live.students, { month: live.month, year: live.year }) : [];
}

async function save(courses: PublishedCourse[], month: number, year: number) {
  if (courses.length === 0) {
    await prisma.topStudentsPublication.deleteMany({});
    return;
  }
  const students = { courses };
  await prisma.topStudentsPublication.upsert({
    where: { id: "current" },
    create: { id: "current", month, year, students, publishedAt: new Date() },
    update: { month, year, students, publishedAt: new Date() },
  });
}

/**
 * Publish the month's top 5.
 *  - With a course: only that course's list is replaced; other courses stay.
 *  - Without a course ("All courses"): every course is replaced by this month.
 */
export async function publishTopStudents(formData: FormData) {
  await requireUser("ADMIN");

  const year = readYear(String(formData.get("year") ?? ""));
  const month = readMonth(String(formData.get("month") ?? ""));
  const course = String(formData.get("course") ?? "");
  if (!month) redirect("/admin/performance?error=period");

  // Re-calculated on the server so the published list always matches the data.
  const rows = await monthlyPerformance(year, month);
  const now = new Date().toISOString();
  const fresh: PublishedCourse[] = groupByCourse(rows)
    .filter((g) => !course || g.courseId === course)
    .map((g) => ({
      courseId: g.courseId,
      courseTitle: g.courseTitle,
      month,
      year,
      publishedAt: now,
      students: g.rows.slice(0, PUBLISH_COUNT).map((r, i) => ({
        studentId: r.studentId,
        rank: i + 1,
        name: r.name,
        courseTitle: r.courseTitle,
        avatarUrl: r.avatarUrl,
        overall: r.overall,
        quiz: r.quiz,
        assignment: r.assignment,
        assessment: r.assessment,
        attendance: r.attendance,
      })),
    }));
  if (fresh.length === 0) redirect(back(year, month, course, "error=empty"));

  const kept = course ? (await currentCourses()).filter((c) => c.courseId !== course) : [];
  const courses = [...kept, ...fresh].sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
  await save(courses, month, year);

  revalidatePath("/");
  revalidatePath("/student");
  revalidatePath("/admin/performance");
  redirect(back(year, month, course, "published=1"));
}

/** Take one course (or, without a course, every course) off the website. */
export async function unpublishTopStudents(formData: FormData) {
  await requireUser("ADMIN");

  const year = readYear(String(formData.get("year") ?? ""));
  const month = readMonth(String(formData.get("month") ?? ""));
  const course = String(formData.get("course") ?? "");

  if (course) {
    const live = await prisma.topStudentsPublication.findUnique({ where: { id: "current" } });
    if (live) {
      const rest = parsePublished(live.students, { month: live.month, year: live.year }).filter(
        (c) => c.courseId !== course,
      );
      await save(rest, live.month, live.year);
    }
  } else {
    await prisma.topStudentsPublication.deleteMany({});
  }

  revalidatePath("/");
  revalidatePath("/student");
  revalidatePath("/admin/performance");
  redirect(back(year, month, course, "removed=1"));
}
