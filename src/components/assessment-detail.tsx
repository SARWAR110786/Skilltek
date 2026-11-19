import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Textarea,
} from "@/components/ui";
import { ConfirmDelete } from "@/components/confirm-delete";
import { dateInputValue, formatDate } from "@/lib/utils";
import {
  ASSESSMENT_TYPES,
  assessmentsPath,
  manageableCourses,
  percentOf,
} from "@/lib/assessments";
import {
  deleteAssessment,
  saveAssessmentMarks,
  updateAssessment,
} from "@/lib/assessment-actions";

const ERRORS: Record<string, string> = {
  required: "Title, type, total marks (more than 0) and date are required.",
  marks: "Some marks were below 0 or above the total marks. Nothing was saved — please fix and save again.",
  total: "Some students already have more marks than the new total. Lower their marks first.",
};

/** Marks sheet for one assessment (admin and teacher). */
export async function AssessmentDetail({
  user,
  id,
  sp,
}: {
  user: SessionUser;
  id: string;
  sp: { created?: string; saved?: string; updated?: string; error?: string };
}) {
  const role = user.role === "ADMIN" ? "ADMIN" : "TEACHER";
  const base = assessmentsPath(role);
  const courses = (await manageableCourses(user)) ?? [];

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      marks: true,
    },
  });
  if (!assessment || !courses.some((c) => c.id === assessment.courseId)) notFound();

  const markedIds = assessment.marks.map((m) => m.studentId);
  const students = await prisma.student.findMany({
    where: {
      courseId: assessment.courseId,
      // Current students, plus anyone who already has a result here.
      OR: [{ exitReason: null }, { id: { in: markedIds } }],
    },
    orderBy: { user: { name: "asc" } },
    select: { id: true, admissionNo: true, exitReason: true, user: { select: { name: true } } },
  });
  const byStudent = new Map(assessment.marks.map((m) => [m.studentId, m]));

  const marked = assessment.marks.filter((m) => m.status === "MARKED" && m.marks != null);
  const absent = assessment.marks.filter((m) => m.status === "ABSENT").length;
  const notSubmitted = assessment.marks.filter((m) => m.status === "NOT_SUBMITTED").length;
  const avg = marked.length
    ? percentOf(marked.reduce((s, m) => s + (m.marks ?? 0), 0) / marked.length, assessment.totalMarks)
    : null;
  const highest = marked.length ? Math.max(...marked.map((m) => m.marks ?? 0)) : null;

  return (
    <div>
      <Link href={base} className="mb-3 inline-block text-xs font-medium text-brand-600 hover:text-brand-700">
        ← All assessments
      </Link>
      <PageHeader
        title={assessment.title}
        subtitle={`${assessment.course.title} · ${assessment.type} · ${formatDate(assessment.date)} · Total ${assessment.totalMarks} marks`}
      />

      {sp.error && ERRORS[sp.error] && <Alert tone="error">{ERRORS[sp.error]}</Alert>}
      {sp.created === "1" && (
        <Alert tone="success">Assessment created. Enter the marks below and click Save marks.</Alert>
      )}
      {sp.saved === "1" && <Alert tone="success">Marks saved. Students can now see their results.</Alert>}
      {sp.updated === "1" && <Alert tone="success">Assessment details updated.</Alert>}

      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Marked" value={`${marked.length} / ${students.length}`} hint="Students with marks" />
        <StatCard label="Average" value={avg == null ? "—" : `${avg}%`} hint="Of marked students" tone="green" />
        <StatCard
          label="Highest"
          value={highest == null ? "—" : `${highest} / ${assessment.totalMarks}`}
          tone="amber"
        />
        <StatCard label="Absent / Not submitted" value={`${absent} / ${notSubmitted}`} tone="red" />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Marks Sheet"
          subtitle="Type the marks, or choose Absent / Not submitted. Leave a row empty to skip that student."
        />
        {students.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No students are enrolled in {assessment.course.title}.
          </p>
        ) : (
          <form action={saveAssessmentMarks}>
            <input type="hidden" name="id" value={assessment.id} />
            <Table head={["Student", `Marks (out of ${assessment.totalMarks})`, "Status", "Remarks"]}>
              {students.map((s) => {
                const m = byStudent.get(s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input type="hidden" name="studentId" value={s.id} />
                      <p className="font-medium text-slate-800">{s.user.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.admissionNo}
                        {s.exitReason ? ` · ${s.exitReason === "DROPOUT" ? "Dropout" : "Passout"}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        name={`marks_${s.id}`}
                        type="number"
                        min={0}
                        max={assessment.totalMarks}
                        step="any"
                        defaultValue={m?.marks ?? ""}
                        placeholder="—"
                        className="!w-28"
                        aria-label={`Marks for ${s.user.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        name={`status_${s.id}`}
                        defaultValue={m?.status ?? "MARKED"}
                        className="!w-auto"
                        aria-label={`Status for ${s.user.name}`}
                      >
                        <option value="MARKED">Marked</option>
                        <option value="ABSENT">Absent</option>
                        <option value="NOT_SUBMITTED">Not submitted</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        name={`remarks_${s.id}`}
                        defaultValue={m?.remarks ?? ""}
                        maxLength={300}
                        placeholder="Optional"
                        className="min-w-[160px]"
                        aria-label={`Remarks for ${s.user.name}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </Table>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                Absent / Not submitted are saved without marks. Marks can include decimals (e.g. 7.5).
              </p>
              <Button type="submit">Save marks</Button>
            </div>
          </form>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Edit details" />
          <form action={updateAssessment} className="grid gap-4 p-5 md:grid-cols-2">
            <input type="hidden" name="id" value={assessment.id} />
            <Field label="Title" required>
              <Input name="title" defaultValue={assessment.title} maxLength={150} required />
            </Field>
            <Field label="Type" required>
              <Select name="type" defaultValue={assessment.type} required>
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Total marks" required>
              <Input
                name="totalMarks"
                type="number"
                min={1}
                step="any"
                defaultValue={assessment.totalMarks}
                required
              />
            </Field>
            <Field label="Date" required>
              <Input name="date" type="date" defaultValue={dateInputValue(assessment.date)} required />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  name="description"
                  rows={2}
                  maxLength={2000}
                  defaultValue={assessment.description ?? ""}
                />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" variant="secondary">
                Save details
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Delete assessment" subtitle="Removes it and all its marks" />
          <div className="p-5">
            <ConfirmDelete
              action={deleteAssessment}
              message={`Delete "${assessment.title}" and all its marks? Students will no longer see it. This cannot be undone.`}
              triggerClassName="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              fields={<input type="hidden" name="id" value={assessment.id} />}
            >
              <Trash2 className="h-4 w-4" />
              Delete assessment
            </ConfirmDelete>
          </div>
        </Card>
      </div>
    </div>
  );
}
