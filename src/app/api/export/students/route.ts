import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExportAuth, csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { studentStatusLabel } from "@/lib/student-status";

export async function GET(req: NextRequest) {
  const user = await getExportAuth();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "pdf" ? "pdf" : "csv";
  const courseParam = sp.get("course") ?? "";

  let where: Record<string, unknown> = {};
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { courses: { select: { id: true } } },
    });
    const ids = teacher?.courses.map((c) => c.id) ?? [];
    if (courseParam && !ids.includes(courseParam)) {
      return new Response("Forbidden", { status: 403 });
    }
    where = courseParam
      ? { courseId: courseParam }
      : { courseId: { in: ids.length ? ids : ["__none__"] } };
  } else if (courseParam) {
    where = { courseId: courseParam };
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { admissionNo: "asc" },
    include: {
      user: true,
      course: { include: { teacher: { include: { user: true } } } },
    },
  });

  const headers = [
    "Roll No",
    "Name",
    "Email",
    "Course",
    "Teacher",
    "Guardian",
    "Guardian Phone",
    "Gender",
    "Status",
  ];
  const rows: Cell[][] = students.map((s) => [
    s.admissionNo,
    s.user.name,
    s.user.email,
    s.course?.title ?? "",
    s.course?.teacher?.user.name ?? "",
    s.guardianName ?? "",
    s.guardianPhone ?? "",
    s.gender ?? "",
    studentStatusLabel(s.user.status, s.exitReason),
  ]);

  const courseTitle = courseParam
    ? (await prisma.course.findUnique({ where: { id: courseParam }, select: { title: true } }))?.title ?? ""
    : "";
  const subtitle = `${courseTitle || "All courses"} · ${students.length} student${students.length === 1 ? "" : "s"}`;
  const fileName = courseTitle ? `students-${slug(courseTitle)}` : "students";
  return format === "pdf"
    ? pdfResponse(fileName, { title: "Students", subtitle, headers, rows })
    : csvResponse(fileName, [headers, ...rows]);
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
