import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { updateQuiz, toggleQuizStatus, deleteQuiz } from "../actions";

async function getData(id: string, teacherId: string, courseIds: string[]) {
  await connection();
  const [quiz, courses, bank] = await Promise.all([
    prisma.quiz.findUnique({
      where: { id },
      include: {
        course: true,
        questions: { orderBy: { order: "asc" }, include: { question: true } },
        attempts: { include: { student: { include: { user: true } } }, orderBy: { submittedAt: "desc" } },
      },
    }),
    prisma.course.findMany({ where: { id: { in: courseIds } }, orderBy: { title: "asc" } }),
    prisma.quizBankQuestion.findMany({ where: { teacherId }, include: { course: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return { quiz, courses, bank };
}

export default async function TeacherQuizDetailPage({
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
  const { quiz, courses, bank } = await getData(id, teacherId, courseIds);

  if (!quiz || quiz.teacherId !== teacherId) notFound();

  const selected = new Set(quiz.questions.map((q) => q.questionId));
  const groups = [
    { key: "general", label: "General", items: bank.filter((q) => !q.courseId) },
    ...courses.map((c) => ({ key: c.id, label: c.title, items: bank.filter((q) => q.courseId === c.id) })),
  ].filter((g) => g.items.length > 0);

  const avgScore = quiz.attempts.length
    ? Math.round(quiz.attempts.reduce((s, a) => s + a.score, 0) / quiz.attempts.length)
    : 0;

  return (
    <div>
      <Link href="/teacher/quizzes" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to quizzes
      </Link>
      <PageHeader
        title={quiz.title}
        subtitle={`${quiz.course.title} · ${quiz.totalMarks} marks · ${quiz.durationMinutes} min`}
        action={
          <div className="flex items-center gap-2">
            <form action={toggleQuizStatus}>
              <input type="hidden" name="id" value={quiz.id} />
              <Button type="submit" variant={quiz.status === "ASSIGNED" ? "secondary" : "primary"}>
                {quiz.status === "ASSIGNED" ? "Unassign" : "Assign to Students"}
              </Button>
            </form>
            <form action={deleteQuiz}>
              <input type="hidden" name="id" value={quiz.id} />
              <Button type="submit" variant="danger"><Trash2 className="h-4 w-4" /> Delete</Button>
            </form>
          </div>
        }
      />

      {sp.created && <Alert tone="success">Quiz created.</Alert>}
      {sp.updated && <Alert tone="success">Quiz updated.</Alert>}
      {sp.error === "required" && <Alert tone="error">Please provide a title and a valid course.</Alert>}
      {sp.error === "noquestions" && <Alert tone="error">Select at least one question.</Alert>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge tone={quiz.status === "ASSIGNED" ? "green" : "gray"}>{quiz.status}</Badge>
        <span className="text-sm text-slate-500">{quiz.attempts.length} attempt{quiz.attempts.length === 1 ? "" : "s"}</span>
        {quiz.attempts.length > 0 && <span className="text-sm text-slate-500">Average score: {avgScore}/{quiz.totalMarks}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Edit Quiz" />
          <form action={updateQuiz} className="grid gap-4 p-5">
            <input type="hidden" name="id" value={quiz.id} />
            <Field label="Title"><Input name="title" defaultValue={quiz.title} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Course">
                <Select name="courseId" defaultValue={quiz.courseId} required>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Duration (minutes)"><Input name="durationMinutes" type="number" min={1} defaultValue={quiz.durationMinutes} /></Field>
            </div>
            <Field label="Description"><Textarea name="description" rows={2} defaultValue={quiz.description ?? ""} /></Field>
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Questions</span>
              <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {groups.map((g) => (
                  <div key={g.key}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                    <div className="space-y-1">
                      {g.items.map((q) => (
                        <label key={q.id} className="flex items-start gap-2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-50">
                          <input type="checkbox" name="questionIds" value={q.id} defaultChecked={selected.has(q.id)} className="mt-0.5 h-4 w-4 rounded" />
                          <span>{q.text} <span className="text-xs text-slate-400">({q.marks} mark{q.marks === 1 ? "" : "s"})</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {groups.length === 0 && <p className="p-4 text-center text-sm text-slate-400">No questions available.</p>}
              </div>
            </div>
            <Button type="submit"><CheckCircle2 className="h-4 w-4" /> Save Changes</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Attempts" subtitle={`${quiz.attempts.length} submission${quiz.attempts.length === 1 ? "" : "s"}`} />
          <Table head={["Student", "Score", "Status", "Submitted"]}>
            {quiz.attempts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{a.student.user.name}</td>
                <td className="px-4 py-3 text-slate-600">{a.score}/{a.total}</td>
                <td className="px-4 py-3">
                  {a.violated
                    ? <Badge tone="red">Violated</Badge>
                    : <Badge tone={a.score >= a.total / 2 ? "green" : "amber"}>{a.score >= a.total / 2 ? "Passed" : "Low"}</Badge>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(a.submittedAt)}</td>
              </tr>
            ))}
            {quiz.attempts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">No attempts yet.</td></tr>
            )}
          </Table>
        </Card>
      </div>
    </div>
  );
}
