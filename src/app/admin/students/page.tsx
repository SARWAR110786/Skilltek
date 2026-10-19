import Link from "next/link";
import { connection } from "next/server";
import { Download, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
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
import { createStudent, deleteStudent, updateStudent, importStudents } from "./actions";

export const instant = false;

async function getData(courseId?: string) {
  await connection();
  const [students, courses] = await Promise.all([
    prisma.student.findMany({
      where: courseId ? { courseId } : undefined,
      orderBy: { admissionDate: "desc" },
      include: {
        user: true,
        course: { include: { teacher: { include: { user: true } } } },
      },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
  ]);
  return { students, courses };
}

const ERRORS: Record<string, string> = {
  required: "Name and email are required.",
  email: "A user with that email already exists.",
  password: "Password must be at least 6 characters.",
  nofile: "Please choose a CSV file to upload.",
  bigfile: "CSV file is too large (max 2 MB).",
  csvempty: "The CSV has no data rows. Add students below the header row.",
  csvheader: 'The CSV header must include at least "Name" and "Email" columns.',
  csvbig: "Too many rows — import up to 300 students at a time.",
};

function filterChip(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer",
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    course?: string;
    created?: string;
    updated?: string;
    edit?: string;
    imported?: string;
    skipped?: string;
    errors?: string;
  }>;
}) {
  const sp = await searchParams;
  const courseFilter = sp.course ?? "";
  const { students, courses } = await getData(courseFilter || undefined);
  const activeCourse = courses.find((c) => c.id === courseFilter);
  const error = sp.error ? ERRORS[sp.error] : null;
  const editing = sp.edit
    ? students.find((s) => s.id === sp.edit) ?? null
    : null;

  return (
    <div>
      <PageHeader
        title={activeCourse ? `Students · ${activeCourse.title}` : "Students"}
        subtitle={`${students.length} enrolled student${students.length === 1 ? "" : "s"}${activeCourse ? ` in this course` : ""}`}
        action={
          activeCourse ? (
            <Link href="/admin/students">
              <Button variant="ghost">Clear filter</Button>
            </Link>
          ) : undefined
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {sp.created === "1" && <Alert tone="success">Student created successfully.</Alert>}
      {sp.updated === "1" && <Alert tone="success">Student updated successfully.</Alert>}
      {sp.imported && (
        <Alert tone={Number(sp.skipped ?? 0) > 0 ? "info" : "success"}>
          Bulk import finished: {sp.imported} student{Number(sp.imported) === 1 ? "" : "s"} created
          {Number(sp.skipped ?? 0) > 0 ? `, ${sp.skipped} row(s) skipped.` : "."}
          {sp.errors ? ` Skipped — ${sp.errors}` : ""}
        </Alert>
      )}

      {editing ? (
        <Card className="mb-6">
          <CardHeader
            title="Edit Student"
            subtitle={`${editing.user.name} · ${editing.admissionNo}`}
            action={
              <Link href={`/admin/students${courseFilter ? `?course=${courseFilter}` : ""}`}>
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            }
          />
          <form action={updateStudent} className="grid gap-4 p-5 md:grid-cols-3">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Full name">
              <Input name="name" defaultValue={editing.user.name} required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" defaultValue={editing.user.email} required />
            </Field>
            <Field label="New password" hint="Leave blank to keep current">
              <Input name="password" type="password" minLength={6} autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone">
              <Input name="phone" defaultValue={editing.user.phone ?? ""} />
            </Field>
            <Field label="CNIC" hint="Optional">
              <Input name="cnic" defaultValue={editing.cnic ?? ""} placeholder="35202-1234567-1" />
            </Field>
            <Field label="Gender">
              <Select name="gender" defaultValue={editing.gender ?? ""}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={editing.user.status}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </Field>
            <Field label="Course">
              <Select name="courseId" defaultValue={editing.courseId ?? ""}>
                <option value="">No course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Guardian name">
              <Input name="guardianName" defaultValue={editing.guardianName ?? ""} />
            </Field>
            <Field label="Guardian phone">
              <Input name="guardianPhone" defaultValue={editing.guardianPhone ?? ""} />
            </Field>
            <Field label="Address">
              <Input name="address" defaultValue={editing.address ?? ""} />
            </Field>
            <div className="md:col-span-3">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader title="Add New Student" subtitle="Creates a login account automatically" />
          <form action={createStudent} className="grid gap-4 p-5 md:grid-cols-3">
            <Field label="Full name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Password" hint="Set the student's login password (min 6 characters)">
              <Input name="password" type="password" minLength={6} required autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone"><Input name="phone" /></Field>
            <Field label="CNIC" hint="Optional"><Input name="cnic" placeholder="35202-1234567-1" /></Field>
            <Field label="Gender">
              <Select name="gender" defaultValue="">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Course">
              <Select name="courseId" defaultValue={courseFilter}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Guardian name"><Input name="guardianName" /></Field>
            <Field label="Guardian phone"><Input name="guardianPhone" /></Field>
            <Field label="Address"><Input name="address" /></Field>
            <div className="md:col-span-3">
              <Button type="submit">Create Student</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Course wise:</span>
        <Link href="/admin/students" className={filterChip(courseFilter === "")}>
          All Students
        </Link>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/students?course=${c.id}`}
            className={filterChip(courseFilter === c.id)}
          >
            {c.title}
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader title="Download" subtitle="Export the student list" />
        <div className="p-5">
          <DownloadForm
            action="/api/export/students"
            fields={courseFilter ? [{ kind: "hidden", name: "course", value: courseFilter }] : []}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Bulk Import Students"
          subtitle="Download the CSV template, fill in one student per row, then upload — all accounts are created at once"
        />
        <div className="flex flex-wrap items-end gap-4 p-5">
          <a
            href="/api/import/students/template"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <Download className="h-4 w-4" /> Download CSV template
          </a>
          <form action={importStudents} className="flex flex-wrap items-end gap-3">
            <Field label="CSV file" hint="Name, Email, Password required · max 300 rows">
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                required
                className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white"
              />
            </Field>
            <Button type="submit">Upload &amp; Create Students</Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardHeader title={activeCourse ? `Students in ${activeCourse.title}` : "All Students"} />
        <Table head={["Student", "Admission #", "Course", "Teacher", "Guardian", "Status", "Actions"]}>
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">{s.user.name}</p>
                <p className="text-xs text-slate-400">{s.user.email}</p>
                {s.cnic && <p className="text-xs text-slate-400">CNIC: {s.cnic}</p>}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.admissionNo}</td>
              <td className="px-4 py-3 text-slate-600">{s.course?.title ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">{s.course?.teacher?.user.name ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {s.guardianName ?? "—"}
                {s.guardianPhone ? <span className="block text-xs text-slate-400">{s.guardianPhone}</span> : null}
              </td>
              <td className="px-4 py-3">
                <Badge tone={s.user.status === "ACTIVE" ? "green" : "gray"}>
                  {s.user.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/students?edit=${s.id}${courseFilter ? `&course=${courseFilter}` : ""}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    Edit
                  </Link>
                  <form action={deleteStudent}>
                    <input type="hidden" name="id" value={s.id} />
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
          {students.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                No students yet. Add your first student above.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
