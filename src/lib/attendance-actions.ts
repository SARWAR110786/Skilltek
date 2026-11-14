"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";

export async function saveAttendance(formData: FormData) {
  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    redirect("/login");
  }

  const dateStr = String(formData.get("date") ?? "").trim();
  // Only same-site relative paths are accepted, so the form can't be used as
  // an open redirect to another website.
  const rawBack = String(formData.get("back") ?? "").trim();
  const home = user.role === "ADMIN" ? "/admin/attendance" : "/teacher/attendance";
  const back =
    rawBack.startsWith("/") && !rawBack.startsWith("//") && !rawBack.includes("\\")
      ? rawBack
      : home;

  if (!dateStr) {
    redirect(back);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = parseDateInput(dateStr);
  const d = new Date(selected);
  d.setHours(0, 0, 0, 0);
  if (d > today) {
    const target = back;
    const sep = target.includes("?") ? "&" : "?";
    redirect(`${target}${sep}error=future`);
  }

  const date = selected;

  const toSave: { studentId: string; status: "PRESENT" | "ABSENT" }[] = [];
  const toClear: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status_")) continue;
    const studentId = key.slice("status_".length);
    const status = String(value);
    if (status === "PRESENT" || status === "ABSENT") {
      toSave.push({ studentId, status });
    } else {
      toClear.push(studentId);
    }
  }

  // Teachers may only mark attendance for students enrolled in their own
  // courses. Any other student id in the form is ignored.
  if (user.role === "TEACHER") {
    const requested = [...toSave.map((t) => t.studentId), ...toClear];
    const allowed = new Set(
      (
        await prisma.student.findMany({
          where: { id: { in: requested }, course: { teacher: { userId: user.id } } },
          select: { id: true },
        })
      ).map((s) => s.id),
    );
    for (let i = toSave.length - 1; i >= 0; i--) {
      if (!allowed.has(toSave[i].studentId)) toSave.splice(i, 1);
    }
    for (let i = toClear.length - 1; i >= 0; i--) {
      if (!allowed.has(toClear[i])) toClear.splice(i, 1);
    }
  }

  const operations = [
    ...toSave.map(({ studentId, status }) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId, date } },
        create: { studentId, date, status, markedById: user.id },
        update: { status, markedById: user.id },
      }),
    ),
    ...(toClear.length
      ? [prisma.attendance.deleteMany({ where: { studentId: { in: toClear }, date } })]
      : []),
  ];

  if (operations.length) {
    await prisma.$transaction(operations);
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher");
  revalidatePath("/student/attendance");
  revalidatePath("/student");

  const target = back;
  const sep = target.includes("?") ? "&" : "?";
  redirect(`${target}${sep}saved=1`);
}
