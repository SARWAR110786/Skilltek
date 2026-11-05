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
  const back = String(formData.get("back") ?? "").trim();

  if (!dateStr) {
    redirect(back || "/");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = parseDateInput(dateStr);
  const d = new Date(selected);
  d.setHours(0, 0, 0, 0);
  if (d > today) {
    const target = back && back.trim() ? back.trim() : "/admin/attendance";
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

  const target = back || "/";
  const sep = target.includes("?") ? "&" : "?";
  redirect(`${target}${sep}saved=1`);
}
