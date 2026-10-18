import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { CHALLAN_STATUS_META } from "@/lib/challan";

async function getData(userId: string) {
  await connection();
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { course: { select: { title: true } } },
  });
  if (!student) return { student: null, challans: [] };
  const challans = await prisma.challan.findMany({
    where: { studentId: student.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return { student, challans };
}

export default async function StudentChallansPage() {
  const user = await requireUser("STUDENT");
  const { student, challans } = await getData(user.id);

  if (!student) {
    return (
      <Card>
        <p className="p-10 text-center text-sm text-slate-500">
          Your student profile is not set up yet. Please contact the administration.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fee Challans"
        subtitle={`${student.admissionNo} · ${student.course?.title ?? "No course assigned"}`}
      />

      <Card>
        <CardHeader title="Your Challans" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Particulars</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challans.map((c) => {
                const meta = CHALLAN_STATUS_META[c.status];
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{c.title}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/challan/${c.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                      >
                        Download Challan
                      </a>
                    </td>
                  </tr>
                );
              })}
              {challans.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                    No fee challans issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
