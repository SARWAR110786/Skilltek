import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTeacherProfile, getStudentProfile } from "@/lib/guard";

const SAFE_INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const search = new URL(req.url).searchParams;
  const kind = search.get("kind") ?? "attachment";
  const disposition = search.get("disposition") === "inline" ? "inline" : "attachment";

  let file: { fileName: string; mimeType: string; size: number; data: Uint8Array } | null = null;
  let allowed = false;

  if (kind === "submission") {
    const found = await prisma.assignmentFile.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            assignment: { select: { teacherId: true, courseId: true, status: true } },
          },
        },
      },
    });
    if (found) {
      file = found;
      const a = found.submission.assignment;
      if (user.role === "ADMIN") allowed = true;
      else if (user.role === "TEACHER") {
        const teacher = await getTeacherProfile(user.id);
        allowed = teacher?.id === a.teacherId;
      } else if (user.role === "STUDENT") {
        const student = await getStudentProfile(user.id);
        allowed = student?.id === found.submission.studentId;
      }
    }
  } else {
    const found = await prisma.assignmentAttachment.findUnique({
      where: { id },
      include: { assignment: { select: { teacherId: true, courseId: true, status: true } } },
    });
    if (found) {
      file = found;
      const a = found.assignment;
      if (user.role === "ADMIN") allowed = true;
      else if (user.role === "TEACHER") {
        const teacher = await getTeacherProfile(user.id);
        allowed = teacher?.id === a.teacherId;
      } else if (user.role === "STUDENT") {
        const student = await getStudentProfile(user.id);
        allowed = a.status === "ASSIGNED" && student?.courseId === a.courseId;
      }
    }
  }

  if (!file) return new NextResponse("Not found", { status: 404 });
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  // The MIME type comes from the uploader's browser and cannot be trusted.
  // Only render a small allow-list of passive formats inline; everything else
  // (HTML, SVG, scripts, ...) is forced to download so an uploaded file can
  // never run script on this site's origin.
  const mime = (file.mimeType || "").toLowerCase();
  const inlineSafe = SAFE_INLINE_TYPES.has(mime);
  const finalDisposition = disposition === "inline" && inlineSafe ? "inline" : "attachment";
  const contentType = inlineSafe ? mime : "application/octet-stream";

  return new NextResponse(Buffer.from(file.data), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${finalDisposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Content-Length": String(file.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
