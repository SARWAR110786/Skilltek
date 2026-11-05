import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExportAuth, csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { dateInputValue, parseDateInput, percent } from "@/lib/utils";

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const user = await getExportAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "pdf" ? "pdf" : "csv";
  const courseId = sp.get("course") ?? "";
  if (!courseId) return new Response("Missing course", { status: 400 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: true },
  });
  if (!course) return new Response("Course not found", { status: 404 });

  if (user.role === "TEACHER" && course.teacher?.userId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const students = await prisma.student.findMany({
    where: { courseId },
    orderBy: { admissionNo: "asc" },
    include: { user: true },
  });
  const ids = students.map((s) => s.id);

  const range = sp.get("range") === "month" ? "month" : "day";
  const title = `Attendance — ${course.title}`;

  let headers: string[];
  let rows: Cell[][];
  let periodLabel: string;
  let filePeriod: string;

  if (range === "month") {
    const monthValue = sp.get("month") ?? dateInputValue().slice(0, 7);
    const [y, m] = monthValue.split("-").map(Number);
    const start = new Date(y || 1970, (m || 1) - 1, 1);
    const end = new Date(y || 1970, m || 1, 1);

    const records = await prisma.attendance.findMany({
      where: { studentId: { in: ids }, date: { gte: start, lt: end } },
    });

    const counts = new Map<string, { present: number; absent: number }>();
    for (const r of records) {
      const entry = counts.get(r.studentId) ?? { present: 0, absent: 0 };
      if (r.status === "PRESENT") entry.present += 1;
      else if (r.status === "ABSENT") entry.absent += 1;
      counts.set(r.studentId, entry);
    }

    headers = ["Roll No", "Name", "Present", "Absent", "Total", "%"];
    rows = students.map((s) => {
      const c = counts.get(s.id) ?? { present: 0, absent: 0 };
      const total = c.present + c.absent;
      return [
        s.admissionNo,
        s.user.name,
        c.present,
        c.absent,
        total,
        `${percent(c.present, total)}%`,
      ];
    });

    periodLabel = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    filePeriod = monthValue;
  } else {
    const dateValue = sp.get("date") ?? dateInputValue();
    const day = parseDateInput(dateValue);
    const records = await prisma.attendance.findMany({
      where: { studentId: { in: ids }, date: day },
    });
    const statusMap = Object.fromEntries(records.map((r) => [r.studentId, r.status]));

    headers = ["Roll No", "Name", "Status"];
    rows = students.map((s) => [s.admissionNo, s.user.name, statusMap[s.id] ?? "Not marked"]);

    periodLabel = day.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    filePeriod = dateValue;
  }

  const subtitle = `${periodLabel} · ${students.length} student${students.length === 1 ? "" : "s"}`;
  const filename = `attendance-${slug(course.title)}-${filePeriod}`;

  return format === "pdf"
    ? pdfResponse(filename, { title, subtitle, headers, rows })
    : csvResponse(filename, [headers, ...rows]);
}
