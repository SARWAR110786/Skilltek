import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
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
  Textarea,
} from "@/components/ui";
import { dateInputValue, formatDate } from "@/lib/utils";
import { ASSESSMENT_TYPES, assessmentsPath, manageableCourses } from "@/lib/assessments";
import { createAssessment } from "@/lib/assessment-actions";

const ERRORS: Record<string, string> = {
  required: "Title, type, course, total marks (more than 0) and date are required.",
  notfound: "That assessment was not found or you can't manage it.",
};

/** Assessments list + "Create assessment" form (admin and teacher). */
export async function AssessmentsList({
  user,
  sp,
}: {
  user: SessionUser;
  sp: { course?: string; error?: string; deleted?: string };
}) {
  const role = user.role === "ADMIN" ? "ADMIN" : "TEACHER";
  const base = assessmentsPath(role);
  const courses = (await manageableCourses(user)) ?? [];
  const courseIds = courses.map((c) => c.id);
  const course = courseIds.includes(sp.course ?? "") ? (sp.course as string) : "";

  const assessments = await prisma.assessment.findMany({
    where: { courseId: course ? course : { in: courseIds } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      course: { select: { title: true, _count: { select: { students: true } } } },
      marks: { select: { status: true, marks: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Offline tests — paper, verbal, practical and more. Enter marks; students see their results."
      />

      {sp.error && ERRORS[sp.error] && <Alert tone="error">{ERRORS[sp.error]}</Alert>}
      {sp.deleted === "1" && <Alert tone="success">Assessment deleted.</Alert>}

      {courses.length === 0 ? (
        <Card className="mb-6">
          <p className="p-6 text-sm text-slate-500">
            {role === "TEACHER"
              ? "You have no courses assigned yet, so you can't create assessments."
              : "Create a course first to add assessments."}
          </p>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader title="Create Assessment" subtitle="Then enter marks for the students of the course" />
          <form action={createAssessment} className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Title" required>
              <Input name="title" placeholder="e.g. Mid-term MS Word paper" maxLength={150} required />
            </Field>
            <Field label="Type" required>
              <Select name="type" defaultValue="Written Paper" required>
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Course" required>
              <Select name="courseId" defaultValue={course || (courses.length === 1 ? courses[0].id : "")} required>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Total marks" required>
              <Input name="totalMarks" type="number" min={1} step="any" placeholder="e.g. 50" required />
            </Field>
            <Field label="Date" required>
              <Input name="date" type="date" defaultValue={dateInputValue()} required />
            </Field>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Description">
                <Textarea
                  name="description"
                  rows={2}
                  maxLength={2000}
                  placeholder="Optional — topics covered, instructions, etc."
                />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2 xl:col-span-3">
              <Button type="submit">Create &amp; enter marks</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader
          title="All Assessments"
          subtitle={`${assessments.length} assessment${assessments.length === 1 ? "" : "s"}`}
          action={
            courses.length > 1 ? (
              <form method="get" className="flex items-center gap-2">
                <Select name="course" defaultValue={course} className="!w-auto !py-1.5 text-xs">
                  <option value="">All courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="secondary">
                  Show
                </Button>
              </form>
            ) : undefined
          }
        />
        <Table head={["Date", "Assessment", "Course", "Total", "Marked", "Average", ""]}>
          {assessments.map((a) => {
            const marked = a.marks.filter((m) => m.status === "MARKED" && m.marks != null);
            const avg = marked.length
              ? Math.round(
                  (marked.reduce((s, m) => s + (m.marks ?? 0), 0) / marked.length / a.totalMarks) * 1000,
                ) / 10
              : null;
            return (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(a.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <Badge tone="blue">{a.type}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{a.course.title}</td>
                <td className="px-4 py-3 text-slate-700">{a.totalMarks}</td>
                <td className="px-4 py-3 text-slate-700">
                  {a.marks.length} / {a.course._count.students}
                </td>
                <td className="px-4 py-3 text-slate-700">{avg == null ? "—" : `${avg}%`}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${base}/${a.id}`}
                    className="inline-flex whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600"
                  >
                    Enter / view marks
                  </Link>
                </td>
              </tr>
            );
          })}
          {assessments.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                No assessments yet. Create one above.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
