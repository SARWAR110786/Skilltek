"use client";

import { useRef, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Mcq = {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
};

export function AiQuizGenerator({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Mcq[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  function reset() {
    setPrompt("");
    setQuestions([]);
    setError(null);
    setSaved(false);
  }

  async function generate() {
    if (!prompt.trim()) {
      setError("Describe what quiz you want (topic, chapter, goal).");
      return;
    }
    setError(null);
    setLoading(true);
    setQuestions([]);
    setSaved(false);
    try {
      const courseName =
        courses.find((c) => c.id === courseId)?.title ?? "";
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "mcqs",
          title: prompt.trim(),
          course: courseName,
          seed: prompt.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const list = (data?.questions as Mcq[] | undefined) ?? [];
      if (!res.ok || list.length === 0) {
        setError(data?.error ?? "AI could not generate MCQs.");
      } else {
        setQuestions(list.slice(0, count));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToBank() {
    if (questions.length === 0 || !courseId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/quiz-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, questions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save to question bank.");
      } else {
        setSaved(true);
        setQuestions([]);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={wrapRef}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> Create with AI
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  AI Quiz Generator
                </h3>
                <p className="text-sm text-slate-500">
                  Ask AI to create MCQs and save them to your question bank
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Field label="What to create">
                  <Textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Create 10 MCQs on What is graphic design and why we use it for Graphic Designing course"
                  />
                </Field>
              </div>
              <Field label="Course">
                <Select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Number of questions">
                <Input
                  type="number"
                  min={5}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value) || 10)}
                />
              </Field>
              <div className="flex items-end md:col-span-2">
                <Button type="button" onClick={generate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate MCQs
                    </>
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <div className="px-6 pb-4 text-sm text-rose-600">{error}</div>
            )}
            {saved && (
              <div className="px-6 pb-4 text-sm text-emerald-600">
                Questions saved to your question bank.
              </div>
            )}
            {questions.length > 0 && (
              <div className="border-t border-slate-100 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    {questions.length} MCQs generated
                  </p>
                  <Button
                    type="button"
                    onClick={saveToBank}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save all to Question Bank"}
                  </Button>
                </div>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="font-medium text-slate-800">
                        {idx + 1}. {q.text}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        {(["A", "B", "C", "D"] as const).map((key) => (
                          <div
                            key={key}
                            className={`rounded-lg px-3 py-2 ${
                              q.correctOption === key
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-50"
                            }`}
                          >
                            <span className="font-medium">{key}.</span>{" "}
                            {q[`option${key}` as keyof Mcq] as string}
                            {q.correctOption === key && (
                              <span className="ml-2 text-xs font-semibold">
                                (Correct)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
