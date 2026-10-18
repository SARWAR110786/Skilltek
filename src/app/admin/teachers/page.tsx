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
  Table,
} from "@/components/ui";
import { DownloadForm } from "@/components/download-form";
import { createTeacher, deleteTeacher, updateTeacher } from "./actions";

export const instant = false;

async function getData() {
  await connection();
  const [teachers, courses] = await Promise.all([
    prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, courses: { orderBy: { title: "asc" } } },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);
  return { teachers, courses };
}

const ERRORS: Record<string, string> = {
  required: "Name and email are required.",
  email: "A user with that email already exists.",
  password: "Password must be at least 6 characters.",
};

function CourseCheckboxes({
  courses,
  checked = [],
}: {
  courses: { id: string; title: string }[];
  checked?: string[];
}) {
  if (courses.length === 0) {
    return <p className="text-sm text-slate-400">No courses yet. Create a course first.</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <label
          key={c.id}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          <input
            type="checkbox"
            name="courseIds"
            value={c.id}
            defaultChecked={checked.includes(c.id)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          {c.title}
        </label>
      ))}
    </div>
  );
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; edit?: string }>;
}) {
  const { teachers, courses } = await getData();
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] : null;
  const editing = sp.edit ? teachers.find((t) => t.id === sp.edit) : null;

  return (
    <div>
      <PageHeader title="Teachers" subtitle={`${teachers.length} faculty member${teachers.length === 1 ? "" : "s"}`} />

      {error && <Alert tone="error">{error}</Alert>}
      {sp.created === "1" && <Alert tone="success">Teacher created successfully.</Alert>}
      {sp.updated === "1" && <Alert tone="success">Teacher updated successfully.</Alert>}

      {editing ? (
        <Card className="mb-6">
          <CardHeader
            title="Edit Teacher"
            subtitle={editing.user.name}
            action={
              <Link href="/admin/teachers">
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            }
          />
          <form action={updateTeacher} className="grid gap-4 p-5 md:grid-cols-3">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Full name"><Input name="name" defaultValue={editing.user.name} required /></Field>
            <Field label="Email"><Input name="email" type="email" defaultValue={editing.user.email} required /></Field>
            <Field label="New password" hint="Leave blank to keep current">
              <Input name="password" type="password" minLength={6} autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone"><Input name="phone" defaultValue={editing.user.phone ?? ""} /></Field>
            <Field label="CNIC" hint="Optional"><Input name="cnic" defaultValue={editing.cnic ?? ""} placeholder="35202-1234567-1" /></Field>
            <div className="md:col-span-3">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assign courses</span>
              <CourseCheckboxes courses={courses} checked={editing.courses.map((c) => c.id)} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader title="Add New Teacher" subtitle="Creates a teacher login account and assigns courses" />
          <form action={createTeacher} className="grid gap-4 p-5 md:grid-cols-3">
            <Field label="Full name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Password" hint="Set the teacher's login password (min 6 characters)">
              <Input name="password" type="password" minLength={6} required autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone"><Input name="phone" /></Field>
            <Field label="CNIC" hint="Optional"><Input name="cnic" placeholder="35202-1234567-1" /></Field>
            <div className="md:col-span-3">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assign courses</span>
              <CourseCheckboxes courses={courses} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Create Teacher</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader title="Download" subtitle="Export the teacher list" />
        <div className="p-5">
          <DownloadForm action="/api/export/teachers" fields={[]} />
        </div>
      </Card>

      <Card>
        <CardHeader title="All Teachers" />
        <Table head={["Teacher", "Courses", "Actions"]}>
          {teachers.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{t.user.name}</p>
                <p className="text-xs text-slate-400">{t.user.email}</p>
                {t.cnic && <p className="text-xs text-slate-400">CNIC: {t.cnic}</p>}
              </td>
              <td className="px-4 py-3">
                {t.courses.length ? (
                  <div className="flex flex-wrap gap-1">
                    {t.courses.map((c) => (
                      <Badge key={c.id} tone="brand">{c.title}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/teachers?edit=${t.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    Edit
                  </Link>
                  <form action={deleteTeacher}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-400">
                No teachers yet. Add your first teacher above.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
