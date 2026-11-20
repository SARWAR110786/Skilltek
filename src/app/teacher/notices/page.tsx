import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

async function getNotices() {
  await connection();
  return prisma.notice.findMany({
    where: { OR: [{ target: "ALL" }, { target: "TEACHERS" }] },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
}

export default async function TeacherNoticesPage() {
  await requireUser("TEACHER");
  const notices = await getNotices();

  return (
    <div>
      <PageHeader title="Notices" subtitle={`${notices.length} announcement${notices.length === 1 ? "" : "s"}`} />
      <div className="space-y-3">
        {notices.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{n.title}</h3>
                  {n.pinned && <Badge tone="amber">Pinned</Badge>}
                  <Badge tone="brand">{n.target === "ALL" ? "Everyone" : "Teachers"}</Badge>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
            </div>
          </Card>
        ))}
        {notices.length === 0 && (
          <Card><p className="p-10 text-center text-sm text-slate-400">No notices yet.</p></Card>
        )}
      </div>
    </div>
  );
}
