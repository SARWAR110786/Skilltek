import Link from "next/link";
import { connection } from "next/server";
import { CalendarClock, Paperclip } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

async function getAssignments(courseId: string, studentId: string) {
  await connection();
  return prisma.assignment.findMany({
    where: { status: "ASSIGNED", courseId },
    include: {
      teacher: { include: { user: true } },
      _count: { select: { attachments: true } },
      submissions: { where: { studentId }, select: { id: true, marksObtained: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function StudentAssignmentsPage() {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);

  if (!student?.courseId) {
    return (
      <div>
        <PageHeader title="Assignments" />
        <Card><p className="p-10 text-center text-sm text-slate-500">You are not enrolled in a course yet.</p></Card>
      </div>
    );
  }

  const assignments = await getAssignments(student.courseId, student.id);

  return (
    <div>
      <PageHeader title="Assignments" subtitle={`${assignments.length} assignment${assignments.length === 1 ? "" : "s"} for your course`} />
      <div className="space-y-4">
        {assignments.map((a) => {
          const submission = a.submissions[0];
          const submitted = !!submission;
          const graded = submission?.marksObtained != null;
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                    <Badge tone={graded ? "brand" : submitted ? "green" : "amber"}>
                      {graded ? `Graded · ${submission.marksObtained}/${a.marks}` : submitted ? "Submitted" : "Pending"}
                    </Badge>
                  </div>
                  {a.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {a.dueDate ? `Due ${formatDate(a.dueDate)}` : "No deadline"}</span>
                    <span>{a.marks} marks</span>
                    {a._count.attachments > 0 && (
                      <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {a._count.attachments} file(s)</span>
                    )}
                    <span>By {a.teacher.user.name}</span>
                  </p>
                </div>
                <Link
                  href={`/student/assignments/${a.id}`}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  {submitted ? "View Result" : "Open"}
                </Link>
              </div>
            </Card>
          );
        })}
        {assignments.length === 0 && (
          <Card><p className="p-10 text-center text-sm text-slate-400">No assignments yet.</p></Card>
        )}
      </div>
    </div>
  );
}
