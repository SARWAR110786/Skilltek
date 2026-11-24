// TEMPORARY admin-only timing check for the Hostinger server. Remove after use.
import { getExportAuth } from "@/lib/export";
import { prisma } from "@/lib/prisma";

async function time<T>(fn: () => Promise<T>) {
  const t = Date.now();
  try {
    const r = await fn();
    return { ms: Date.now() - t, ok: true, r };
  } catch (e) {
    const err = e as { message?: string; cause?: { code?: string; message?: string } };
    return { ms: Date.now() - t, ok: false, r: `${err.message} ${err.cause?.code ?? ""} ${err.cause?.message ?? ""}`.trim() };
  }
}

export async function GET() {
  const user = await getExportAuth();
  if (!user || user.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });
  const ping = (url: string) =>
    time(async () => {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
      return r.status;
    });
  const out = {
    uptimeSec: Math.round(process.uptime()),
    port: process.env.PORT ?? null,
    privateOrigin: process.env.__NEXT_PRIVATE_ORIGIN ?? null,
    db: await time(() => prisma.course.count()),
    db2: await time(() => prisma.course.count()),
    selfPublic: await ping("https://theskilltek.com/robots.txt"),
    selfLocal3000: await ping("http://127.0.0.1:3000/robots.txt"),
    selfPort: process.env.PORT ? await ping(`http://127.0.0.1:${process.env.PORT}/robots.txt`) : null,
  };
  return Response.json(out);
}
