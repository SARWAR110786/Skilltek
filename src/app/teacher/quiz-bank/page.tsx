import Link from "next/link";
import { connection } from "next/server";
import { Pencil, Trash2 } from "lucide-react";
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
import { QuizQuestionFields } from "@/components/quiz-question-fields";
import { createBankQuestion, updateBankQuestion, deleteBankQuestion } from "./actions";

async function getData(teacherId: string, courseIds: string[]) {
  await connection();
  const [questions, courses] = await Promise.all([
    prisma.quizBankQuestion.findMany({
      where: { teacherId },
      include: { course: true, _count: { select: { quizQuestions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      orderBy: { title: "asc" },
    }),
  ]);
  return { questions, courses };
}

export default async function QuizBankPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    created?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser("TEACHER");
  const teacher = await getTeacherProfile(user.id);
  const teacherId = teacher?.id ?? "";
  const courseIds = teacher?.courses.map((c) => c.id) ?? [];
  const { questions, courses } = await getData(teacherId, courseIds);
  const sp = await searchParams;
  const editing = sp.edit ? questions.find((q) => q.id === sp.edit) : undefined;

  return (
    <div>
      <PageHeader
        title="Quiz Bank"
        subtitle="Build a library of questions with answers to reuse across quizzes"
      />

      {sp.created && <Alert tone="success">Question added to your quiz bank.</Alert>}
      {sp.updated && <Alert tone="success">Question updated.</Alert>}
      {sp.error === "required" && <Alert tone="error">Question text and at least options A and B are required.</Alert>}
      {sp.error === "notfound" && <Alert tone="error">That question could not be found.</Alert>}

      <Card className="mb-6">
        <CardHeader
          title={editing ? "Edit Question" : "Add Question"}
          subtitle={editing ? undefined : "Include the correct answer so quizzes can be auto-scored"}
        />
        <form
          action={editing ? updateBankQuestion : createBankQuestion}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <QuizQuestionFields
            defaultText={editing?.text ?? ""}
            defaultOptionA={editing?.optionA ?? ""}
            defaultOptionB={editing?.optionB ?? ""}
            defaultOptionC={editing?.optionC ?? ""}
            defaultOptionD={editing?.optionD ?? ""}
            defaultCorrect={editing?.correctOption ?? "A"}
          />
          <Field label="Marks">
            <Input name="marks" type="number" min={1} defaultValue={editing?.marks ?? 1} />
          </Field>
          <Field label="Course (optional)" hint="Leave blank for a general question">
            <Select name="courseId" defaultValue={editing?.courseId ?? ""}>
              <option value="">General</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button type="submit">{editing ? "Save Changes" : "Add to Bank"}</Button>
            {editing && (
              <Link href="/teacher/quiz-bank">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Questions" subtitle={`${questions.length} question${questions.length === 1 ? "" : "s"} in bank`} />
        <Table head={["Question", "Correct", "Marks", "Course", "Used", ""]}>
          {questions.map((q) => (
            <tr key={q.id} className="hover:bg-slate-50">
              <td className="max-w-md px-4 py-3">
                <p className="font-medium text-slate-800">{q.text}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                  A) {q.optionA} · B) {q.optionB}
                  {q.optionC ? ` · C) ${q.optionC}` : ""}
                  {q.optionD ? ` · D) ${q.optionD}` : ""}
                </p>
              </td>
              <td className="px-4 py-3"><Badge tone="green">{q.correctOption}</Badge></td>
              <td className="px-4 py-3 text-slate-600">{q.marks}</td>
              <td className="px-4 py-3 text-slate-600">{q.course?.title ?? "General"}</td>
              <td className="px-4 py-3"><Badge tone="gray">{q._count.quizQuestions}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/teacher/quiz-bank?edit=${q.id}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <form action={deleteBankQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {questions.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No questions yet. Add your first above.</td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
