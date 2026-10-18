import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const image = await prisma.galleryImage.findUnique({
    where: { id },
    select: { mimeType: true, size: true, data: true },
  });

  if (!image) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(image.data), {
    headers: {
      "Content-Type": image.mimeType || "image/jpeg",
      "Content-Length": String(image.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
