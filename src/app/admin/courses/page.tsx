import Link from "next/link";
import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
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

import { DownloadForm } from "@/components/download-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createCourse, deleteCourse, updateCourse } from "./actions";
import { dateInputValue, formatDate } from "@/lib/utils";
import { CourseDates } from "@/components/course-dates";

export const instant = false;

async function getData() {
  await connection();
  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { include: { user: true } },
        _count: { select: { students: true } },
      },
    }),
    prisma.teacher.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: true },
    }),
  ]);
  return { courses, teachers };
}

const ERRORS: Record<string, string> = {
  required: "Please fill in all required fields correctly.",
  title: "Course title already exists.",
  dates: "Please pick a start and an end date (the end can't be before the start, and a course can be at most 60 months).",
  inuse:
    "This course still has students, quizzes, assignments or assessments, so it can't be deleted. Untick \"Active course\" when editing it to hide it instead.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    edit?: string;
  }>;
}) {
  const { courses, teachers } = await getData();
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] : null;
  const editing = sp.edit ? courses.find((c) => c.id === sp.edit) : null;

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {sp.created === "1" && <Alert tone="success">Course created successfully.</Alert>}
      {sp.updated === "1" && <Alert tone="success">Course updated successfully.</Alert>}

      {editing ? (
        <Card className="mb-6">
          <CardHeader
            title="Edit Course"
            subtitle={`${editing.title} · Code ${editing.code ?? "—"}`}
            action={
              <Link href="/admin/courses">
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            }
          />
          <form action={updateCourse} className="grid gap-4 p-5 md:grid-cols-2">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Title" required>
              <Input name="title" defaultValue={editing.title} required minLength={2} maxLength={80} />
            </Field>
            <Field label="Assign teacher">
              <Select name="teacherId" defaultValue={editing.teacherId ?? ""}>
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </Select>
            </Field>
            <CourseDates
              defaultStart={editing.startDate ? dateInputValue(editing.startDate) : ""}
              defaultEnd={editing.endDate ? dateInputValue(editing.endDate) : ""}
              fallbackMonths={editing.durationMonths}
            />
            <div className="md:col-span-2">
              <Field label="Description" required>
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={editing.description ?? ""}
                  placeholder="Describe the course"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editing.active}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Active course
            </label>
            <div className="flex items-end md:justify-end">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader
            title="Add New Course"
            subtitle="Course code is assigned automatically (001, 002, …) and used in roll numbers like SK-26-001-01."
          />
          <form action={createCourse} className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Title" required>
              <Input name="title" required minLength={2} maxLength={80} />
            </Field>
            <div className="hidden md:block" />
            <CourseDates />
            <div className="md:col-span-2">
              <Field label="Description" required>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Describe the course"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Create Course</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader title="Download" subtitle="Export the course list" />
        <div className="p-5">
          <DownloadForm action="/api/export/courses" fields={[]} />
        </div>
      </Card>

      <Card>
        <CardHeader title="All Courses" />
        <Table head={["Course", "Duration", "Teacher", "Students", "Actions"]}>
          {courses.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{c.title}</p>
                <p className="text-xs font-mono text-slate-500">Code: {c.code ?? "—"}</p>
                <p className="line-clamp-1 text-xs text-slate-400">{c.description ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p>{c.durationMonths} mo</p>
                {(c.startDate || c.endDate) && (
                  <p className="whitespace-nowrap text-xs text-slate-400">
                    {c.startDate ? formatDate(c.startDate) : "?"} – {c.endDate ? formatDate(c.endDate) : "?"}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{c.teacher?.user.name ?? "—"}</td>
              <td className="px-4 py-3"><Badge tone="brand">{c._count.students}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/courses?edit=${c.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/students?course=${c.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    View Students
                  </Link>
                  <ConfirmDelete
                    action={deleteCourse}
                    message={`Delete ${c.title}? This may affect students and teachers.`}
                    fields={<input type="hidden" name="id" value={c.id} />}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                </div>
              </td>
            </tr>
          ))}
          {courses.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No courses yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
