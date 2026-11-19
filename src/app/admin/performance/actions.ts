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
  type PublishedCourse,
} from "@/lib/performance";

/** Put this month's top 5 of every course on the website (replaces any earlier month). */
export async function publishTopStudents(formData: FormData) {
  await requireUser("ADMIN");

  const year = readYear(String(formData.get("year") ?? ""));
  const month = readMonth(String(formData.get("month") ?? ""));
  if (!month) redirect("/admin/performance?error=period");

  // Re-calculated on the server so the published list always matches the data.
  const rows = await monthlyPerformance(year, month);
  const courses: PublishedCourse[] = groupByCourse(rows).map((g) => ({
    courseTitle: g.courseTitle,
    students: g.rows.slice(0, PUBLISH_COUNT).map((r, i) => ({
      rank: i + 1,
      name: r.name,
      courseTitle: r.courseTitle,
      avatarUrl: r.avatarUrl,
      overall: r.overall,
      quiz: r.quiz,
      assignment: r.assignment,
      attendance: r.attendance,
    })),
  }));
  if (courses.length === 0) {
    redirect(`/admin/performance?year=${year}&month=${month}&error=empty`);
  }
  const students = { courses };

  await prisma.topStudentsPublication.upsert({
    where: { id: "current" },
    create: { id: "current", year, month, students, publishedAt: new Date() },
    update: { year, month, students, publishedAt: new Date() },
  });

  revalidatePath("/");
  revalidatePath("/admin/performance");
  redirect(`/admin/performance?year=${year}&month=${month}&published=1`);
}

/** Take the top students off the website. */
export async function unpublishTopStudents(formData: FormData) {
  await requireUser("ADMIN");

  await prisma.topStudentsPublication.deleteMany({});

  const year = readYear(String(formData.get("year") ?? ""));
  const month = readMonth(String(formData.get("month") ?? ""));
  revalidatePath("/");
  revalidatePath("/admin/performance");
  redirect(
    `/admin/performance?year=${year}${month ? `&month=${month}` : ""}&removed=1`,
  );
}
