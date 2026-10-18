import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Award, Download, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getStudentProfile } from "@/lib/guard";
import { Alert, Badge, Button, Card, CardHeader, Field, PageHeader, Textarea } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";
import { submitAssignment } from "../actions";

export default async function StudentAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser("STUDENT");
  const student = await getStudentProfile(user.id);
  const { id } = await params;
  const sp = await searchParams;
  if (!student) notFound();
  await connection();

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      teacher: { include: { user: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      submissions: { where: { studentId: student.id }, include: { files: true } },
    },
  });

  if (!assignment || assignment.status !== "ASSIGNED" || assignment.courseId !== student.courseId) notFound();

  const submission = assignment.submissions[0];

  return (
    <div>
      <Link href="/student/assignments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to assignments
      </Link>
      <PageHeader
        title={assignment.title}
        subtitle={`${assignment.course.title} · ${assignment.marks} marks${assignment.dueDate ? ` · due ${formatDate(assignment.dueDate)}` : ""}`}
      />

      {sp.submitted && <Alert tone="success">Your submission has been saved.</Alert>}

      <div className="mb-4">
        <Badge tone={submission ? "green" : "amber"}>{submission ? "Submitted" : "Pending"}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Instructions" subtitle={`By ${assignment.teacher.user.name}`} />
            <p className="whitespace-pre-line p-5 text-sm text-slate-600">{assignment.description ?? "No instructions provided."}</p>
          </Card>

          <Card>
            <CardHeader title="Reference Files" subtitle={`${assignment.attachments.length} file${assignment.attachments.length === 1 ? "" : "s"}`} />
            <ul className="divide-y divide-slate-100">
              {assignment.attachments.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{f.fileName}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <a href={`/api/files/${f.id}?kind=attachment`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Download">
                    <Download className="h-4 w-4" />
                  </a>
                </li>
              ))}
              {assignment.attachments.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No files attached.</li>}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {submission ? (
            <Card>
              <CardHeader title="Your Result" subtitle={`Submitted ${formatDateTime(submission.submittedAt)}`} />
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Award className="h-8 w-8" />
                </span>
                {submission.marksObtained === null || submission.marksObtained === undefined ? (
                  <>
                    <p className="text-lg font-semibold text-slate-800">Awaiting evaluation</p>
                    <p className="text-sm text-slate-500">
                      Your submission is recorded. Marks will appear once your teacher evaluates them.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-500">You scored</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {submission.marksObtained}
                      <span className="text-2xl font-medium text-slate-400">/{assignment.marks}</span>
                    </p>
                    <p className="text-sm text-slate-500">out of {assignment.marks} marks</p>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Submit Assignment" subtitle="Upload one or more files" />
              <form action={submitAssignment} className="space-y-4 p-5">
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <Field label="Note (optional)">
                  <Textarea name="note" rows={3} placeholder="Anything to add for your teacher?" />
                </Field>
                <Field label="Files" hint="Select multiple files if needed">
                  <input type="file" name="files" multiple className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white" />
                </Field>
                <Button type="submit">
                  <Upload className="h-4 w-4" /> Submit
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
