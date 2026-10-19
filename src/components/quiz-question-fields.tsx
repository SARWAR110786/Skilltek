"use client";

import { useRef, useState } from "react";
import { Eraser, Loader2, Sparkles } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui";

const OPTIONS = ["A", "B", "C", "D"] as const;
type OptionKey = (typeof OPTIONS)[number];

type Mcq = {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionKey;
};

export function QuizQuestionFields({
  defaultText = "",
  defaultOptionA = "",
  defaultOptionB = "",
  defaultOptionC = "",
  defaultOptionD = "",
  defaultCorrect = "A",
}: {
  defaultText?: string;
  defaultOptionA?: string;
  defaultOptionB?: string;
  defaultOptionC?: string;
  defaultOptionD?: string;
  defaultCorrect?: string;
}) {
  const [text, setText] = useState(defaultText);
  const [options, setOptions] = useState({
    A: defaultOptionA,
    B: defaultOptionB,
    C: defaultOptionC,
    D: defaultOptionD,
  });
  const [correct, setCorrect] = useState<OptionKey>(
    (OPTIONS as readonly string[]).includes(defaultCorrect)
      ? (defaultCorrect as OptionKey)
      : "A",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  function setOption(key: OptionKey, value: string) {
    setOptions((prev) => ({ ...prev, [key]: value }));
    setAiDraft(false);
  }

  async function generate() {
    const form = wrapRef.current?.closest("form");
    const courseEl = form?.elements.namedItem("courseId");
    const course =
      courseEl instanceof HTMLSelectElement
        ? (courseEl.selectedOptions[0]?.text ?? "")
        : "";
    const seed = text.trim();

    if (!seed) {
      setError("Type a topic or hint in the Question box first, then generate.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "mcq", title: seed, course, seed }),
      });
      const data = await res.json().catch(() => ({}));
      const mcq = data?.mcq as Mcq | undefined;
      if (!res.ok || !mcq) {
        setError(data?.error ?? "AI could not generate — fill the question yourself.");
      } else {
        setText(mcq.text);
        setOptions({
          A: mcq.optionA,
          B: mcq.optionB,
          C: mcq.optionC,
          D: mcq.optionD,
        });
        setCorrect(mcq.correctOption);
        setAiDraft(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function writeOwn() {
    setText("");
    setOptions({ A: "", B: "", C: "", D: "" });
    setCorrect("A");
    setAiDraft(false);
    setError(null);
  }

  return (
    <div ref={wrapRef} className="contents">
      <div className="md:col-span-2">
        <Field
          label="Question"
          hint="Type a topic or hint, then click Generate MCQ with AI — or write everything yourself"
        >
          <Textarea
            name="text"
            rows={2}
            value={text}
            required
            placeholder="Type the question (or a topic to generate one)…"
            onChange={(e) => {
              setText(e.target.value);
              setAiDraft(false);
            }}
          />
        </Field>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading
              ? "Generating…"
              : aiDraft
                ? "Regenerate MCQ with AI"
                : "Generate MCQ with AI"}
          </button>
          {(text || options.A || options.B || options.C || options.D) && (
            <button
              type="button"
              onClick={writeOwn}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              <Eraser className="h-3.5 w-3.5" /> Write my own
            </button>
          )}
          {aiDraft && (
            <span className="text-[11px] text-slate-400">
              AI filled options A–D and the correct answer — edit freely
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>

      {OPTIONS.map((key) => (
        <Field key={key} label={`Option ${key}`}>
          <Input
            name={`option${key}`}
            value={options[key]}
            required={key === "A" || key === "B"}
            onChange={(e) => setOption(key, e.target.value)}
          />
        </Field>
      ))}

      <Field label="Correct option">
        <Select
          name="correctOption"
          value={correct}
          onChange={(e) => {
            setCorrect(e.target.value as OptionKey);
            setAiDraft(false);
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              Option {o}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
