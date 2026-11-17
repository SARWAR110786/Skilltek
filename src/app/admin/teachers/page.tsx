import Link from "next/link";
import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
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
import { CoursePicker } from "@/components/course-picker";
import { NumericInput } from "@/components/numeric-input";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createTeacher, deleteTeacher, updateTeacher } from "./actions";

export const instant = false;

async function getData(search?: string) {
  await connection();
  const query = search?.trim();

  const where: Prisma.TeacherWhereInput | undefined = query
    ? {
        OR: [
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { user: { phone: { contains: query, mode: "insensitive" } } },
          { cnic: { contains: query, mode: "insensitive" } },
          {
            courses: {
              some: { title: { contains: query, mode: "insensitive" } },
            },
          },
        ],
      }
    : undefined;

  const [teachers, courses] = await Promise.all([
    prisma.teacher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: true, courses: { orderBy: { title: "asc" } } },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);
  return { teachers, courses };
}

const ERRORS: Record<string, string> = {
  required: "Please fill in every field — all fields are required.",
  name: "Enter a valid full name (2–80 characters).",
  invalidEmail: "Enter a valid email address.",
  email: "A user with that email already exists.",
  password: "Password must be between 6 and 72 characters.",
  phone: "Enter a valid 11-digit phone number, e.g. 0300-1234567.",
  cnic: "Enter a valid 13-digit CNIC in the format XXXXX-XXXXXXX-X, e.g. 41409-1234567-1.",
  course: "Select at least one valid course.",
};

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    q?: string;
    created?: string;
    updated?: string;
    edit?: string;
  }>;
}) {
  const sp = await searchParams;
  const { teachers, courses } = await getData();
  const error = sp.error ? ERRORS[sp.error] : null;
  const editing = sp.edit ? teachers.find((t) => t.id === sp.edit) : null;

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} faculty member${teachers.length === 1 ? "" : "s"}`}
      />

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
            <Field label="Full name" required>
              <Input
                name="name"
                defaultValue={editing.user.name}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </Field>
            <Field label="Email" required>
              <Input
                name="email"
                type="email"
                defaultValue={editing.user.email}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="New password" hint="Leave blank to keep current">
              <Input
                name="password"
                type="password"
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
            </Field>
            <Field label="Phone" required>
              <NumericInput
                mode="phone"
                name="phone"
                defaultValue={editing.user.phone ?? ""}
                required
              />
            </Field>
            <Field label="CNIC" required>
              <NumericInput
                mode="cnic"
                name="cnic"
                defaultValue={editing.cnic ?? ""}
                placeholder="35202-1234567-1"
                required
              />
            </Field>
            <div className="md:col-span-3">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Assign courses
                <span className="ml-0.5 text-rose-600" aria-hidden="true">
                  *
                </span>
              </span>
              <CoursePicker
                courses={courses}
                selected={editing.courses.map((c) => c.id)}
              />
              <span className="mt-1 block text-xs text-slate-400">
                Select one or more courses.
              </span>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={courses.length === 0}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader title="Add New Teacher" subtitle="Creates a teacher login account and assigns courses" />
          {courses.length === 0 && (
            <div className="px-5 pt-4">
              <Alert tone="info">
                No courses yet.{" "}
                <Link href="/admin/courses" className="underline">
                  Create a course
                </Link>{" "}
                before adding a teacher.
              </Alert>
            </div>
          )}
          <form action={createTeacher} className="grid gap-4 p-5 md:grid-cols-3">
            <Field label="Full name" required>
              <Input
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </Field>
            <Field label="Email" required>
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password" hint="Set the teacher's login password (min 6 characters)" required>
              <Input
                name="password"
                type="password"
                minLength={6}
                maxLength={72}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
            </Field>
            <Field label="Phone" required>
              <NumericInput mode="phone" name="phone" required />
            </Field>
            <Field label="CNIC" required>
              <NumericInput
                mode="cnic"
                name="cnic"
                placeholder="35202-1234567-1"
                required
              />
            </Field>
            <div className="md:col-span-3">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Assign courses
                <span className="ml-0.5 text-rose-600" aria-hidden="true">
                  *
                </span>
              </span>
              <CoursePicker courses={courses} />
              <span className="mt-1 block text-xs text-slate-400">
                Select one or more courses.
              </span>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={courses.length === 0}>
                Create Teacher
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search removed as requested */}

      {/* Download removed as requested */}

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
                  <ConfirmDelete
                    action={deleteTeacher}
                    message={`Delete ${t.user.name}? This will remove their login and unassign their courses.`}
                    fields={<input type="hidden" name="id" value={t.id} />}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                </div>
              </td>
            </tr>
          ))}
          {teachers.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-400">
                "No teachers yet. Add your first teacher above."
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
