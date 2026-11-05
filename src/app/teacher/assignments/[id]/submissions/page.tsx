import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  Table,
} from "@/components/ui";
import { MarksSelect } from "@/components/marks-select";
import { formatDateTime } from "@/lib/utils";
import { gradeSubmissionsBulk } from "../../grade.actions";

export default async function TeacherAssignmentSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const { id } = await params;
  const sp = await searchParams;
  await connection();

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: true,
      submissions: {
        include: {
          student: { include: { user: true } },
          files: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { submittedAt: "asc" },
      },
    },
  });

  if (!teacher || !assignment || assignment.teacherId !== teacher.id) notFound();

  return (
    <div>
      <Link
        href="/teacher/assignments"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to assignments
      </Link>
      <PageHeader
        title="Submissions"
        subtitle={`${assignment.title} · ${assignment.course.title} · ${assignment.marks} marks`}
        action={
          <Badge tone="brand">
            {assignment.submissions.length} submitted
          </Badge>
        }
      />

      {sp.saved && <Alert tone="success">Marks saved for all students.</Alert>}

      <Card>
        <CardHeader
          title="Students who submitted"
          subtitle="Choose marks for each student, then save once at the end"
        />
        <form action={gradeSubmissionsBulk}>
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <Table
            head={[
              "#",
              "Student",
              "Files",
              `Marks (out of ${assignment.marks})`,
              "Submitted",
            ]}
          >
            {assignment.submissions.map((s, index) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">
                    {s.student.user.name}
                  </p>
                  {s.note && (
                    <p className="max-w-[220px] text-xs text-slate-500">
                      {s.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {s.files.map((f) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <a
                          href={`/api/files/${f.id}?kind=submission&disposition=inline`}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[180px] truncate text-xs text-slate-600 hover:text-brand-600 hover:underline"
                          title="View file"
                        >
                          {f.fileName}
                        </a>
                        <a
                          href={`/api/files/${f.id}?kind=submission`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-600"
                          aria-label={`Download ${f.fileName}`}
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </div>
                    ))}
                    {s.files.length === 0 && (
                      <span className="text-xs text-slate-400">No files</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <MarksSelect
                    name={`marks_${s.id}`}
                    max={assignment.marks}
                    defaultValue={s.marksObtained}
                    className="w-24 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDateTime(s.submittedAt)}
                </td>
              </tr>
            ))}
            {assignment.submissions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No submissions yet.
                </td>
              </tr>
            )}
          </Table>
          {assignment.submissions.length > 0 && (
            <div className="flex items-center justify-end border-t border-slate-100 px-5 py-4">
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4" /> Save all marks
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
