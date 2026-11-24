"use server";


import { guard } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDateInput, todayStart } from "@/lib/utils";

async function saveAttendance__impl(formData: FormData) {
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    redirect(back);
  }
  const selected = parseDateInput(dateStr);
  if (selected > todayStart()) {
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

  // Temporarily inactive students still have attendance; only permanent
  // dropouts/passouts are rejected, including crafted form submissions.
  // Teachers are additionally limited to students in their own courses.
  const submittedIds = Array.from(
    new Set([...toSave.map((entry) => entry.studentId), ...toClear]),
  );
  let allowedIds = new Set(submittedIds);
  if (submittedIds.length) {
    const eligible = await prisma.student.findMany({
      where: {
        id: { in: submittedIds },
        exitReason: null,
        ...(user.role === "TEACHER"
          ? { course: { teacher: { userId: user.id } } }
          : {}),
      },
      select: { id: true },
    });
    allowedIds = new Set(eligible.map((s) => s.id));
  }
  const eligibleSaves = toSave.filter((entry) => allowedIds.has(entry.studentId));
  const eligibleClears = toClear.filter((id) => allowedIds.has(id));

  const operations = [
    ...eligibleSaves.map(({ studentId, status }) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId, date } },
        create: { studentId, date, status, markedById: user.id },
        update: { status, markedById: user.id },
      }),
    ),
    ...(eligibleClears.length
      ? [prisma.attendance.deleteMany({ where: { studentId: { in: eligibleClears }, date } })]
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

// Friendly errors instead of the crash page (see lib/safe-action.ts).
export async function saveAttendance(...args: Parameters<typeof saveAttendance__impl>) {
  return guard(() => saveAttendance__impl(...args));
}
