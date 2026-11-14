import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CheckCircle2, Download, Eye, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser, getTeacherProfile } from "@/lib/guard";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
} from "@/components/ui";
import { UPLOAD_ERROR_TEXT } from "@/lib/uploads";
import { AiAssistTextarea } from "@/components/ai-assist";
import { MarksSelect } from "@/components/marks-select";
import { dateInputValue, formatDate, formatDateTime } from "@/lib/utils";
import {
  updateAssignment,
  toggleAssignmentStatus,
  deleteAssignment,
  deleteAssignmentAttachment,
} from "../actions";
import { gradeSubmission } from "../grade.actions";

async function getData(id: string, courseIds: string[]) {
  await connection();
  const [assignment, courses] = await Promise.all([
    prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        attachments: { orderBy: { createdAt: "asc" } },
        submissions: {
          include: { student: { include: { user: true } }, files: true },
          orderBy: { submittedAt: "desc" },
        },
      },
    }),
    prisma.course.findMany({ where: { id: { in: courseIds } }, orderBy: { title: "asc" } }),
  ]);
  return { assignment, courses };
}

export default async function TeacherAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const { id } = await params;
  const sp = await searchParams;
  const teacherId = teacher?.id ?? "";
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const { assignment, courses } = await getData(id, courseIds);

  if (!assignment || assignment.teacherId !== teacherId) notFound();

  return (
    <div>
      <Link href="/teacher/assignments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to assignments
      </Link>
      <PageHeader
        title={assignment.title}
        subtitle={`${assignment.course.title} · ${assignment.marks} marks${assignment.dueDate ? ` · due ${formatDate(assignment.dueDate)}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <form action={toggleAssignmentStatus}>
              <input type="hidden" name="id" value={assignment.id} />
              <Button type="submit" variant={assignment.status === "ASSIGNED" ? "secondary" : "primary"}>
                {assignment.status === "ASSIGNED" ? "Unassign" : "Assign to Students"}
              </Button>
            </form>
            <form action={deleteAssignment}>
              <input type="hidden" name="id" value={assignment.id} />
              <Button type="submit" variant="danger"><Trash2 className="h-4 w-4" /> Delete</Button>
            </form>
          </div>
        }
      />

      {sp.created && <Alert tone="success">Assignment created.</Alert>}
      {sp.updated && <Alert tone="success">Assignment updated.</Alert>}
      {sp.error === "required" && <Alert tone="error">Please provide a title and a valid course.</Alert>}
      {sp.error && UPLOAD_ERROR_TEXT[sp.error] && <Alert tone="error">{UPLOAD_ERROR_TEXT[sp.error]}</Alert>}

      <div className="mb-6"><Badge tone={assignment.status === "ASSIGNED" ? "green" : "gray"}>{assignment.status}</Badge></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Edit Assignment" />
          <form action={updateAssignment} className="grid gap-4 p-5">
            <input type="hidden" name="id" value={assignment.id} />
            <Field label="Title"><Input name="title" defaultValue={assignment.title} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Course">
                <Select name="courseId" defaultValue={assignment.courseId} required>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Marks"><Input name="marks" type="number" min={0} defaultValue={assignment.marks} /></Field>
            </div>
            <Field label="Deadline (days after creation)">
              <Input
                name="days"
                type="number"
                min={1}
                defaultValue={
                  assignment.dueDate
                    ? Math.max(1, Math.round((assignment.dueDate.getTime() - assignment.createdAt.getTime()) / 86_400_000))
                    : undefined
                }
              />
            </Field>
            <Field label="Description / Instructions">
              <AiAssistTextarea name="description" kind="assignment" rows={3} defaultValue={assignment.description ?? ""} />
            </Field>
            <Field label="Add reference files">
              <input type="file" name="files" multiple className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white" />
            </Field>
            <Button type="submit"><CheckCircle2 className="h-4 w-4" /> Save Changes</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Reference Files" subtitle={`${assignment.attachments.length} file${assignment.attachments.length === 1 ? "" : "s"}`} />
            <ul className="divide-y divide-slate-100">
              {assignment.attachments.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{f.fileName}</p>
                    <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={`/api/files/${f.id}?kind=attachment`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Download">
                      <Download className="h-4 w-4" />
                    </a>
                    <form action={deleteAssignmentAttachment}>
                      <input type="hidden" name="id" value={f.id} />
                      <button type="submit" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </li>
              ))}
              {assignment.attachments.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No files attached.</li>}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Submissions" subtitle={`${assignment.submissions.length} submitted`} />
            <Table head={["Student", "Files", "Marks", "Submitted"]}>
              {assignment.submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.student.user.name}</p>
                    {s.note && <p className="text-xs text-slate-500">{s.note}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {s.files.map((f) => (
                        <div key={f.id} className="flex items-center gap-2">
                          <span className="max-w-[180px] truncate text-xs text-slate-600" title={f.fileName}>
                            {f.fileName}
                          </span>
                          <a
                            href={`/api/files/${f.id}?kind=submission&disposition=inline`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            aria-label={`View ${f.fileName}`}
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`/api/files/${f.id}?kind=submission`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            aria-label={`Download ${f.fileName}`}
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                      {s.files.length === 0 && <span className="text-xs text-slate-400">No files</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <form action={gradeSubmission} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <MarksSelect
                        max={assignment.marks}
                        defaultValue={s.marksObtained}
                        className="w-24 px-2 py-1 text-xs"
                      />
                      <Button type="submit" size="sm">Save</Button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.submittedAt)}</td>
                </tr>
              ))}
              {assignment.submissions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">No submissions yet.</td></tr>
              )}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
