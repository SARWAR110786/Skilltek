import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { MARK_STATUS_LABEL, percentOf } from "@/lib/assessments";

export default async function StudentAssessmentsPage() {
  await connection();
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  if (!student) {
    return (
      <Card>
        <p className="p-10 text-center text-sm text-slate-500">
          Your student profile is not set up yet. Please contact the administration.
        </p>
      </Card>
    );
  }

  // Assessments of the student's course, plus any older result of theirs.
  const assessments = await prisma.assessment.findMany({
    where: {
      OR: [
        ...(student.courseId ? [{ courseId: student.courseId }] : []),
        { marks: { some: { studentId: student.id } } },
      ],
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      course: { select: { title: true } },
      marks: { where: { studentId: student.id } },
    },
  });

  const results = assessments.map((a) => ({ a, m: a.marks[0] ?? null }));
  const marked = results.filter((r) => r.m?.status === "MARKED" && r.m.marks != null);
  const obtained = marked.reduce((s, r) => s + (r.m?.marks ?? 0), 0);
  const possible = marked.reduce((s, r) => s + r.a.totalMarks, 0);
  const overall = percentOf(obtained, possible);

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Results of your paper, verbal and practical tests"
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Assessments" value={results.length} hint="In your course" />
        <StatCard label="Results" value={marked.length} hint="Marked so far" tone="green" />
        <StatCard
          label="Overall"
          value={overall == null ? "—" : `${overall}%`}
          hint={possible ? `${obtained} / ${possible} marks` : "No marks yet"}
          tone="amber"
        />
      </div>

      <Card>
        <CardHeader title="Your Results" />
        <Table head={["Date", "Assessment", "Marks", "Result", "Remarks"]}>
          {results.map(({ a, m }) => {
            const pct = m?.status === "MARKED" ? percentOf(m.marks, a.totalMarks) : null;
            return (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(a.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {a.type} · {a.course.title}
                  </p>
                  {a.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                  {m?.status === "MARKED" && m.marks != null
                    ? `${m.marks} / ${a.totalMarks}`
                    : `— / ${a.totalMarks}`}
                </td>
                <td className="px-4 py-3">
                  {!m ? (
                    <Badge tone="gray">Result pending</Badge>
                  ) : m.status === "MARKED" ? (
                    <Badge tone={pct != null && pct >= 50 ? "green" : "amber"}>{pct}%</Badge>
                  ) : (
                    <Badge tone="red">{MARK_STATUS_LABEL[m.status]}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{m?.remarks ?? ""}</td>
              </tr>
            );
          })}
          {results.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                No assessments yet.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
