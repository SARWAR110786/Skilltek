import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { csvResponse, pdfResponse, type Cell } from "@/lib/export";
import { formatDateTime } from "@/lib/utils";

const STATUS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ADMITTED: "Admitted",
  CLOSED: "Closed",
};

/** Admission forms (or service requests) from the website: admins only. */
export async function GET(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const format = (sp.get("format") || "csv").toLowerCase();
  const service = sp.get("type") === "service";

  const rows = await prisma.enquiry.findMany({
    where: service ? { service: { not: null } } : { service: null },
    orderBy: { createdAt: "desc" },
    include: { course: { select: { title: true } } },
  });

  const headers = ["#", "Name", "Phone", "Email", service ? "Service" : "Program", "Message", "Received", "Status"];
  const data: Cell[][] = rows.map((e, i) => [
    i + 1,
    e.name,
    e.phone ?? "",
    e.email ?? "",
    (service ? e.service : e.course?.title) ?? "",
    e.message ?? "",
    formatDateTime(e.createdAt),
    STATUS[e.status] ?? e.status,
  ]);

  const name = service ? "service-requests" : "admission-forms";
  if (format === "pdf") {
    return pdfResponse(name, {
      title: `SkillTek Institute · ${service ? "Service Requests" : "Admission Forms"}`,
      subtitle: `${rows.length} ${service ? "request" : "form"}${rows.length === 1 ? "" : "s"} from the website`,
      headers,
      rows: data,
    });
  }
  return csvResponse(name, [headers, ...data]);
}
