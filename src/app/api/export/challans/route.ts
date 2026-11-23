import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExportAuth } from "@/lib/export";
import { csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { CHALLAN_STATUS_META, challanBalance } from "@/lib/challan";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;

export async function GET(req: Request) {
  const user = await getExportAuth();
  // Fee records are private financial data: admins only.
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const status = searchParams.get("status") || "";
  const courseId = searchParams.get("course") || "";

  const where: any = {};
  if (status && STATUSES.includes(status as any)) where.status = status;
  if (courseId) where.student = { courseId };

  const challans = await prisma.challan.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      student: {
        include: {
          user: true,
          course: { select: { title: true } },
        },
      },
    },
  });

  const headers = [
    "Date Issued",
    "Due Date",
    "Student",
    "Roll No",
    "Course",
    "Particulars",
    "Amount (PKR)",
    "Paid (PKR)",
    "Balance (PKR)",
    "Status",
    "Payment Method",
    "Paid Date",
    "Notes",
  ];

  const rows: Cell[][] = challans.map((c) => [
    formatDate(c.createdAt),
    formatDate(c.dueDate),
    c.student.user.name,
    c.student.admissionNo,
    c.student.course?.title ?? "",
    c.title,
    c.amount,
    c.paidAmount,
    challanBalance(c),
    CHALLAN_STATUS_META[c.status].label,
    c.paymentMethod ?? "",
    c.paidDate ? formatDate(c.paidDate) : "",
    c.notes ?? "",
  ]);

  const courseTitle = courseId
    ? (await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }))?.title ?? ""
    : "";
  const statusLabel = status && STATUSES.includes(status as any)
    ? CHALLAN_STATUS_META[status as (typeof STATUSES)[number]].label
    : "";
  const fileName = ["challans", courseTitle && slug(courseTitle), statusLabel && slug(statusLabel)]
    .filter(Boolean)
    .join("-");

  if (format === "pdf") {
    return pdfResponse(fileName, {
      title: "SkillTek Institute · Fee Challans",
      subtitle: `${courseTitle || "All courses"}${statusLabel ? ` · ${statusLabel}` : ""} · ${challans.length} challan${challans.length === 1 ? "" : "s"}`,
      headers,
      rows,
    });
  }
  return csvResponse(fileName, [headers, ...rows]);
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
