import Link from "next/link";
import { connection } from "next/server";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Badge, Card, CardHeader, PageHeader, StatCard, Table } from "@/components/ui";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

export const instant = false;

async function getData() {
  await connection();
  const [courses, assignments] = await Promise.all([
    prisma.course.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { students: true } } },
    }),
    prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true } },
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { submissions: true, attachments: true } },
      },
    }),
  ]);
  return { courses, assignments };
}

function filterChip(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer",
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
  );
}

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; assignment?: string }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;
  const courseFilter = sp.course ?? "";
  const { courses, assignments } = await getData();

  const activeCourse = courses.find((c) => c.id === courseFilter);
  const visible = courseFilter
    ? assignments.filter((a) => a.courseId === courseFilter)
    : assignments;

  const totalSubmissions = assignments.reduce((n, a) => n + a._count.submissions, 0);

  const selected = sp.assignment
    ? assignments.find((a) => a.id === sp.assignment) ?? null
    : null;
  const submissions = selected
    ? await prisma.assignmentSubmission.findMany({
        where: { assignmentId: selected.id },
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          files: { select: { id: true, fileName: true, size: true } },
        },
        orderBy: { submittedAt: "desc" },
      })
    : [];
  const attachments = selected
    ? await prisma.assignmentAttachment.findMany({
        where: { assignmentId: selected.id },
        select: { id: true, fileName: true, size: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={activeCourse ? `Assignments · ${activeCourse.title}` : "Assignments"}
        subtitle={
          activeCourse
            ? `${visible.length} assignment${visible.length === 1 ? "" : "s"} · ${activeCourse._count.students} students enrolled`
            : "Select a course to view its assignments one by one"
        }
        action={
          activeCourse ? (
            <Link href="/admin/assignments">
              <Badge tone="gray">Clear filter</Badge>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Assignments" value={assignments.length} tone="blue" />
        <StatCard label="Submissions" value={totalSubmissions} tone="green" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Course wise:</span>
        <Link href="/admin/assignments" className={filterChip(courseFilter === "")}>
          All Courses
        </Link>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/assignments?course=${c.id}`}
            className={filterChip(courseFilter === c.id)}
          >
            {c.title} ({c._count.students})
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader
          title={activeCourse ? `Assignments in ${activeCourse.title}` : "All Assignments"}
          subtitle="Click an assignment to view instructions and submissions"
        />
        <Table head={["Assignment", "Course", "Teacher", "Marks", "Deadline", "Submissions", "Status"]}>
          {visible.map((a) => (
            <tr key={a.id} className={cn("hover:bg-slate-50", sp.assignment === a.id && "bg-brand-50")}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/assignments?${courseFilter ? `course=${courseFilter}&` : ""}assignment=${a.id}`}
                  className="font-medium text-slate-800 hover:text-brand-600"
                >
                  {a.title}
                </Link>
                {sp.assignment === a.id && <span className="ml-2 text-xs text-brand-600">▾ details below</span>}
              </td>
              <td className="px-4 py-3 text-slate-600">{a.course.title}</td>
              <td className="px-4 py-3 text-slate-600">{a.teacher.user.name}</td>
              <td className="px-4 py-3 text-slate-600">{a.marks}</td>
              <td className="px-4 py-3 text-slate-600">{a.dueDate ? formatDate(a.dueDate) : "—"}</td>
              <td className="px-4 py-3"><Badge tone={a._count.submissions > 0 ? "green" : "gray"}>{a._count.submissions}</Badge></td>
              <td className="px-4 py-3"><Badge tone={a.status === "ASSIGNED" ? "green" : "gray"}>{a.status}</Badge></td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No assignments yet.</td></tr>
          )}
        </Table>
      </Card>

      {selected && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title={selected.title}
              subtitle={`${selected.course.title} · ${selected.marks} marks${selected.dueDate ? ` · due ${formatDate(selected.dueDate)}` : ""}`}
            />
            <div className="space-y-4 p-5">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Instructions</p>
                <p className="whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  {selected.description ?? "No instructions provided."}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Reference files ({attachments.length})</p>
                {attachments.length ? (
                  <ul className="space-y-1">
                    {attachments.map((f) => (
                      <li key={f.id}>
                        <a
                          href={`/api/files/${f.id}?kind=attachment`}
                          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> {f.fileName} ({(f.size / 1024).toFixed(1)} KB)
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">No files attached.</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Submissions"
              subtitle={`${submissions.length} student${submissions.length === 1 ? "" : "s"} submitted`}
            />
            <Table head={["Student", "Files", "Marks", "Submitted"]}>
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.student.user.name}</p>
                    <p className="text-xs text-slate-400">{s.student.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {s.files.map((f) => (
                        <a
                          key={f.id}
                          href={`/api/files/${f.id}?kind=submission`}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> {f.fileName}
                        </a>
                      ))}
                      {s.files.length === 0 && <span className="text-xs text-slate-400">No files</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {s.marksObtained != null ? `${s.marksObtained}/${selected.marks}` : <span className="font-normal text-slate-400">Not graded</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(s.submittedAt)}</td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">No submissions yet.</td></tr>
              )}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
