import Link from "next/link";
import { connection } from "next/server";
import { Download, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
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
import { NumericInput } from "@/components/numeric-input";
import { StudentsAutoSearch } from "@/components/students-auto-search";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createStudent, deleteStudent, updateStudent, importStudents } from "./actions";

export const instant = false;

async function getData(courseId?: string, search?: string) {
  await connection();
  const query = search?.trim();

  const where: Prisma.StudentWhereInput | undefined = query
    ? {
        ...(courseId ? { courseId } : {}),
        OR: [
          { admissionNo: { contains: query, mode: "insensitive" } },
          { cnic: { contains: query, mode: "insensitive" } },
          { guardianName: { contains: query, mode: "insensitive" } },
          { guardianPhone: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { user: { phone: { contains: query, mode: "insensitive" } } },
          { course: { title: { contains: query, mode: "insensitive" } } },
        ],
      }
    : courseId
      ? { courseId }
      : undefined;

  const [students, courses] = await Promise.all([
    prisma.student.findMany({
      where,
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
  required: "Please fill in every field — all fields are required.",
  name: "Enter a valid full name (2–80 characters).",
  invalidEmail: "Enter a valid email address.",
  email: "A user with that email already exists.",
  password: "Password must be between 6 and 72 characters.",
  phone: "Enter a valid 11-digit phone number, e.g. 0300-1234567.",
  cnic: "Enter a valid 13-digit CNIC in the format XXXXX-XXXXXXX-X, e.g. 41409-1234567-1.",
  gender: "Select a gender.",
  course: "Select a valid course.",
  guardian: "Enter a valid guardian name (2–80 characters).",
  guardianPhone: "Enter a valid 11-digit phone number, e.g. 0300-7654321.",
  address: "Enter a valid address (5–200 characters).",
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
    q?: string;
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
  const query = (sp.q ?? "").trim();
  const { students, courses } = await getData(
    courseFilter || undefined,
    query || undefined,
  );
  const activeCourse = courses.find((c) => c.id === courseFilter);
  const error = sp.error ? ERRORS[sp.error] : null;
  const editing = sp.edit
    ? students.find((s) => s.id === sp.edit) ?? null
    : null;

  return (
    <div>
      <PageHeader
        title={activeCourse ? `Students · ${activeCourse.title}` : "Students"}
        subtitle={`${students.length} enrolled student${students.length === 1 ? "" : "s"}${activeCourse ? ` in this course` : ""}${query ? ` matching "${query}"` : ""}`}
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
              <Link
                href={`/admin/students${courseFilter ? `?course=${courseFilter}` : ""}${query ? `${courseFilter ? "&" : "?"}q=${encodeURIComponent(query)}` : ""}`}
              >
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            }
          />
          <form action={updateStudent} className="grid gap-4 p-5 md:grid-cols-3">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Full name" required>
              <Input name="name" defaultValue={editing.user.name} required minLength={2} maxLength={80} autoComplete="name" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" defaultValue={editing.user.email} required maxLength={254} autoComplete="email" />
            </Field>
            <Field label="New password" hint="Leave blank to keep current. Otherwise 6–72 characters.">
              <Input name="password" type="password" minLength={6} maxLength={72} autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone" required>
              <NumericInput
                mode="phone"
                name="phone"
                defaultValue={editing.user.phone ?? ""}
                required
                minLength={7}
                maxLength={20}
                pattern="[0-9+()\-\s]{7,20}"
                title="Digits only (7–20); +, -, spaces and parentheses allowed."
                autoComplete="tel"
                placeholder="0300-1234567"
              />
            </Field>
            <Field label="CNIC" required hint="Digits only — auto-formatted as 41409-1234567-1">
              <NumericInput
                mode="cnic"
                name="cnic"
                defaultValue={editing.cnic ?? ""}
                required
                maxLength={15}
                pattern="[0-9]{5}-?[0-9]{7}-?[0-9]"
                title="Enter a 13-digit CNIC, e.g. 41409-1234567-1."
                placeholder="41409-1234567-1"
              />
            </Field>
            <Field label="Gender" required>
              <Select name="gender" defaultValue={editing.gender ?? ""} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Status" required>
              <Select name="status" defaultValue={editing.user.status} required>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </Field>
            <Field label="Course" required>
              <Select name="courseId" defaultValue={editing.courseId ?? ""} required>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Guardian name" required>
              <Input name="guardianName" defaultValue={editing.guardianName ?? ""} required minLength={2} maxLength={80} />
            </Field>
            <Field label="Guardian phone" required>
              <NumericInput
                mode="phone"
                name="guardianPhone"
                defaultValue={editing.guardianPhone ?? ""}
                required
                minLength={7}
                maxLength={20}
                pattern="[0-9+()\-\s]{7,20}"
                title="Digits only (7–20); +, -, spaces and parentheses allowed."
                placeholder="0300-7654321"
              />
            </Field>
            <Field label="Address" required>
              <Input name="address" defaultValue={editing.address ?? ""} required minLength={5} maxLength={200} autoComplete="street-address" />
            </Field>
            <div className="md:col-span-3">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader
            title="Add New Student"
            subtitle="All fields are required — creates a login account automatically"
          />
          {courses.length === 0 && (
            <div className="px-5 pt-4">
              <Alert tone="info">
                No courses exist yet.{" "}
                <Link href="/admin/courses" className="font-semibold underline">
                  Create a course
                </Link>{" "}
                before adding students.
              </Alert>
            </div>
          )}
          <form action={createStudent} className="grid gap-4 p-5 md:grid-cols-3">
            <Field label="Full name" required>
              <Input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="e.g. Ali Khan" />
            </Field>
            <Field label="Email" required>
              <Input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="student@example.com" />
            </Field>
            <Field label="Password" hint="6–72 characters" required>
              <Input name="password" type="password" minLength={6} maxLength={72} required autoComplete="new-password" placeholder="At least 6 characters" />
            </Field>
            <Field label="Phone" required>
              <NumericInput
                mode="phone"
                name="phone"
                required
                minLength={7}
                maxLength={20}
                pattern="[0-9+()\-\s]{7,20}"
                title="Digits only (7–20); +, -, spaces and parentheses allowed."
                autoComplete="tel"
                placeholder="0300-1234567"
              />
            </Field>
            <Field label="CNIC" required hint="Digits only — auto-formatted as 41409-1234567-1">
              <NumericInput
                mode="cnic"
                name="cnic"
                required
                maxLength={15}
                pattern="[0-9]{5}-?[0-9]{7}-?[0-9]"
                title="Enter a 13-digit CNIC, e.g. 41409-1234567-1."
                placeholder="41409-1234567-1"
              />
            </Field>
            <Field label="Gender" required>
              <Select name="gender" defaultValue="" required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Course" required>
              <Select name="courseId" defaultValue={courseFilter} required disabled={courses.length === 0}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Guardian name" required>
              <Input name="guardianName" required minLength={2} maxLength={80} placeholder="e.g. Mr. Khan" />
            </Field>
            <Field label="Guardian phone" required>
              <NumericInput
                mode="phone"
                name="guardianPhone"
                required
                minLength={7}
                maxLength={20}
                pattern="[0-9+()\-\s]{7,20}"
                title="Digits only (7–20); +, -, spaces and parentheses allowed."
                placeholder="0300-7654321"
              />
            </Field>
            <Field label="Address" required>
              <Input name="address" required minLength={5} maxLength={200} autoComplete="street-address" placeholder="House 12, Lahore" />
            </Field>
            <div className="md:col-span-3">
              <Button type="submit" disabled={courses.length === 0}>Create Student</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Course wise:</span>
        <Link
          href={`/admin/students${query ? `?q=${encodeURIComponent(query)}` : ""}`}
          className={filterChip(courseFilter === "")}
        >
          All Students
        </Link>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/students?course=${c.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
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
            <Field label="CSV file">
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
        <CardHeader
          title={activeCourse ? `Students in ${activeCourse.title}` : "All Students"}
          action={
            <StudentsAutoSearch
              defaultValue={query}
              courseFilter={courseFilter || undefined}
            />
          }
        />
        <Table head={["Student", "Roll No", "Course", "Teacher", "Guardian", "Status", "Actions"]}>
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
                    href={`/admin/students?edit=${s.id}${courseFilter ? `&course=${courseFilter}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
                  >
                    Edit
                  </Link>
                  <ConfirmDelete
                    action={deleteStudent}
                    message={`Delete ${s.user.name} (${s.admissionNo})? This will remove their login and all records.`}
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <Trash2 className="h-4 w-4" />
                  </ConfirmDelete>
                </div>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                {query
                  ? `No students match "${query}".`
                  : "No students yet. Add your first student above."}
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
