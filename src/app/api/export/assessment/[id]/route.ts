import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { formatDate } from "@/lib/utils";
import { MARK_STATUS_LABEL, manageableCourses, percentOf } from "@/lib/assessments";

/** Marks sheet of one assessment as CSV or PDF (admin, or the course's teacher). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const format = (new URL(req.url).searchParams.get("format") || "csv").toLowerCase();

  const courses = (await manageableCourses(user)) ?? [];
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { course: { select: { title: true } }, marks: true },
  });
  if (!assessment || !courses.some((c) => c.id === assessment.courseId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Same students as the marks sheet: current ones plus anyone with a result.
  const markedIds = assessment.marks.map((m) => m.studentId);
  const students = await prisma.student.findMany({
    where: {
      courseId: assessment.courseId,
      OR: [{ exitReason: null }, { id: { in: markedIds } }],
    },
    orderBy: { user: { name: "asc" } },
    select: { id: true, admissionNo: true, user: { select: { name: true } } },
  });
  const byStudent = new Map(assessment.marks.map((m) => [m.studentId, m]));
  const total = assessment.totalMarks;

  const headers = ["#", "Student", "Roll No", "Marks", "Out of", "%", "Status", "Remarks"];
  const rows: Cell[][] = students.map((s, i) => {
    const m = byStudent.get(s.id);
    const marks = m && m.status === "MARKED" && m.marks != null ? m.marks : null;
    return [
      i + 1,
      s.user.name,
      s.admissionNo,
      marks ?? "",
      total,
      marks != null ? `${percentOf(marks, total)}%` : "",
      m ? MARK_STATUS_LABEL[m.status] : "Not entered",
      m?.remarks ?? "",
    ];
  });

  const markedList = assessment.marks.filter((m) => m.status === "MARKED" && m.marks != null);
  const avg = markedList.length
    ? percentOf(markedList.reduce((s, m) => s + (m.marks ?? 0), 0) / markedList.length, total)
    : null;
  const highest = markedList.length ? Math.max(...markedList.map((m) => m.marks ?? 0)) : null;
  const absent = assessment.marks.filter((m) => m.status === "ABSENT").length;
  const notSubmitted = assessment.marks.filter((m) => m.status === "NOT_SUBMITTED").length;

  // One short line under the title (a longer one would run off the page).
  const subtitle = `${assessment.course.title} · ${assessment.type} · ${formatDate(assessment.date)} · Total ${total} marks`.slice(0, 95);

  const safeName =
    assessment.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60).toLowerCase() ||
    "assessment";
  const filename = `marks-${safeName}`;

  if (format === "pdf") {
    return pdfResponse(filename, {
      title: `SkillTek Institute · ${assessment.title}`,
      subtitle,
      headers,
      rows: [
        ...rows,
        [],
        ["", "Marked", `${markedList.length} / ${students.length}`],
        ["", "Average", avg != null ? `${avg}%` : "-"],
        ["", "Highest", highest != null ? `${highest} / ${total}` : "-"],
        ["", "Absent", absent],
        ["", "Not submitted", notSubmitted],
      ],
    });
  }
  // CSV: a few lines about the assessment, a blank line, then the sheet.
  return csvResponse(filename, [
    ["Assessment", assessment.title],
    ["Course", assessment.course.title],
    ["Type", assessment.type],
    ["Date", formatDate(assessment.date)],
    ["Total marks", total],
    ["Marked", `${markedList.length} / ${students.length}`],
    ["Average", avg != null ? `${avg}%` : "-"],
    ["Highest", highest ?? "-"],
    ["Absent", absent],
    ["Not submitted", notSubmitted],
    [],
    headers,
    ...rows,
  ]);
}
