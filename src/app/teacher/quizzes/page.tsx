import Link from "next/link";
import { connection } from "next/server";
import { Plus, Trash2 } from "lucide-react";
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

import { QuestionPicker } from "@/components/question-picker";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDelete } from "@/components/confirm-delete";
import { createQuiz, deleteQuiz } from "./actions";

async function getData(teacherId: string, courseIds: string[]) {
  await connection();
  const [courses, bank, quizzes] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } }, orderBy: { title: "asc" } }),
    prisma.quizBankQuestion.findMany({
      where: { teacherId },
      include: { course: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quiz.findMany({
      where: { teacherId },
      include: { course: true, _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { courses, bank, quizzes };
}

export default async function TeacherQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const teacherId = teacher?.id ?? "";
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const { courses, bank, quizzes } = await getData(teacherId, courseIds);
  const sp = await searchParams;

  const groups = [
    { key: "general", label: "General", items: bank.filter((q) => !q.courseId) },
    ...courses.map((c) => ({
      key: c.id,
      label: c.title,
      items: bank.filter((q) => q.courseId === c.id),
    })),
  ].filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader title="Quizzes" subtitle="Create quizzes from your bank and assign them to a course" />

      {sp.error === "required" && <Alert tone="error">Please provide a title and a valid course.</Alert>}
      {sp.error === "noquestions" && <Alert tone="error">Select at least one question from your quiz bank.</Alert>}
      {sp.deleted && <Alert tone="success">Quiz deleted.</Alert>}

      {bank.length === 0 && (
        <Alert tone="info">
          Your quiz bank is empty. <Link href="/teacher/quiz-bank" className="font-semibold underline">Add questions first</Link>.
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader title="Create Quiz" subtitle="Pick a course and the questions to include" />
        <form action={createQuiz} className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Title"><Input name="title" placeholder="e.g. Chapter 1 Test" required /></Field>
          <Field label="Course">
            <Select name="courseId" required defaultValue="">
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (minutes)"><Input name="durationMinutes" type="number" min={1} defaultValue={15} /></Field>
          <Field label="Total marks">
            <Input name="totalMarks" type="number" min={1} step={0.5} defaultValue={5} placeholder="e.g. 5" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                name="description"
                rows={2}
                placeholder="Optional instructions for students"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Questions from bank</span>
            <QuestionPicker groups={groups.map((g) => ({ key: g.key, label: g.label, items: g.items.map((q) => ({ id: q.id, text: q.text, marks: q.marks })) }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={bank.length === 0}><Plus className="h-4 w-4" /> Create Quiz</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="All Quizzes" subtitle={`${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"}`} />
        <Table head={["Title", "Course", "Questions", "Marks", "Attempts", "Status", ""]}>
          {quizzes.map((q) => (
            <tr key={q.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/teacher/quizzes/${q.id}`} className="font-medium text-slate-800 hover:text-brand-600">{q.title}</Link>
                <p className="text-xs text-slate-400">{formatDateTime(q.createdAt)}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{q.course.title}</td>
              <td className="px-4 py-3 text-slate-600">{q._count.questions}</td>
              <td className="px-4 py-3 text-slate-600">{q.totalMarks}</td>
              <td className="px-4 py-3 text-slate-600">{q._count.attempts}</td>
              <td className="px-4 py-3">
                <Badge tone={q.status === "ASSIGNED" ? "green" : "gray"}>{q.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <ConfirmDelete action={deleteQuiz} message={`Delete quiz "${q.title}"?`}>
                  <input type="hidden" name="id" value={q.id} />
                  <Trash2 className="h-4 w-4" />
                </ConfirmDelete>
              </td>
            </tr>
          ))}
          {quizzes.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No quizzes yet.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
