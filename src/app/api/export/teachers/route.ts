import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExportAuth, csvResponse, pdfResponse, type Cell } from "@/lib/export";

export async function GET(req: NextRequest) {
  const user = await getExportAuth();
  if (!user || user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, courses: { orderBy: { title: "asc" } } },
  });

  const headers = ["Name", "Email", "Phone", "Courses", "Status"];
  const rows: Cell[][] = teachers.map((t) => [
    t.user.name,
    t.user.email,
    t.user.phone ?? "",
    t.courses.map((c) => c.title).join("; "),
    t.user.status,
  ]);

  const subtitle = `${teachers.length} faculty member${teachers.length === 1 ? "" : "s"}`;
  return format === "pdf"
    ? pdfResponse("teachers", { title: "Teachers", subtitle, headers, rows })
    : csvResponse("teachers", [headers, ...rows]);
}
