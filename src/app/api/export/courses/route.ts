import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExportAuth, csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getExportAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "csv";

  let where: Record<string, unknown> = {};
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { courses: { select: { id: true } } },
    });
    const ids = teacher?.courses.map((c) => c.id) ?? [];
    where = { id: { in: ids.length ? ids : ["__none__"] } };
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { title: "asc" },
    include: {
      teacher: { include: { user: true } },
      _count: { select: { students: true } },
    },
  });

  const headers = ["Title", "Duration (months)", "Start Date", "End Date", "Teacher", "Students", "Active"];
  const rows: Cell[][] = courses.map((c) => [
    c.title,
    c.durationMonths,
    c.startDate ? formatDate(c.startDate) : "",
    c.endDate ? formatDate(c.endDate) : "",
    c.teacher?.user.name ?? "—",
    c._count.students,
    c.active ? "Yes" : "No",
  ]);

  const subtitle = `${courses.length} course${courses.length === 1 ? "" : "s"}`;
  return format === "pdf"
    ? pdfResponse("courses", { title: "Courses", subtitle, headers, rows })
    : csvResponse("courses", [headers, ...rows]);
}
