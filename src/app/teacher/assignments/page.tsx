import Link from "next/link";
import { connection } from "next/server";
import { Plus, Trash2, Eye } from "lucide-react";
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

import { formatDate } from "@/lib/utils";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createAssignment, deleteAssignment } from "./actions";

async function getData(teacherId: string, courseIds: string[]) {
  await connection();
  const [courses, assignments] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } }, orderBy: { title: "asc" } }),
    prisma.assignment.findMany({
      where: { teacherId },
      include: { course: true, _count: { select: { submissions: true, attachments: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { courses, assignments };
}

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const teacherId = teacher?.id ?? "";
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const { courses, assignments } = await getData(teacherId, courseIds);
  const sp = await searchParams;

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Create assignments and share resources with your courses" />

          {sp.error === "required" && <Alert tone="error">Please provide a title, a valid course, and marks greater than 0.</Alert>}
          {sp.error && UPLOAD_ERROR_TEXT[sp.error] && <Alert tone="error">{UPLOAD_ERROR_TEXT[sp.error]}</Alert>}
      {sp.deleted && <Alert tone="success">Assignment deleted.</Alert>}

      <Card className="mb-6">
        <CardHeader title="Create Assignment" subtitle="Students upload their work; you can attach reference files too" />
        <form action={createAssignment} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Title"><Input name="title" placeholder="e.g. Build a landing page" required /></Field>
          <Field label="Course">
            <Select name="courseId" required defaultValue="">
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Marks" required><Input name="marks" type="number" min={1} defaultValue={10} required /></Field>
          <Field label="Deadline (days after creation)"><Input name="days" type="number" min={1} defaultValue={7} /></Field>
          <div className="md:col-span-2">
            <Field label="Description / Instructions">
              <textarea
                name="description"
                rows={3}
                placeholder="What should students do?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Reference files" hint="Optional — attach one or more files for students">
              <input type="file" name="files" multiple className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={courses.length === 0}><Plus className="h-4 w-4" /> Create Assignment</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="All Assignments" subtitle={`${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`} />
        <Table head={["Title", "Course", "Marks", "Deadline", "Files", "Submissions", "Status", ""]}>
          {assignments.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/teacher/assignments/${a.id}`} className="font-medium text-slate-800 hover:text-brand-600">{a.title}</Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{a.course.title}</td>
              <td className="px-4 py-3 text-slate-600">{a.marks}</td>
              <td className="px-4 py-3 text-slate-600">{a.dueDate ? formatDate(a.dueDate) : "—"}</td>
              <td className="px-4 py-3 text-slate-600">{a._count.attachments}</td>
              <td className="px-4 py-3 text-slate-600">{a._count.submissions}</td>
              <td className="px-4 py-3"><Badge tone={a.status === "ASSIGNED" ? "green" : "gray"}>{a.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ConfirmDelete action={deleteAssignment} message={`Delete assignment "${a.title}"?`}>
                    <input type="hidden" name="id" value={a.id} />
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                  {a._count.submissions > 0 && (
                    <Link
                      href={`/teacher/assignments/${a.id}/submissions`}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Submissions
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {assignments.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No assignments yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
