"use client";

import { useRef, useState } from "react";
import { Eraser, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui";

export type AiAssistKind = "assignment" | "quiz" | "question" | "course";

export function AiAssistTextarea({
  name,
  kind,
  rows = 3,
  defaultValue = "",
  placeholder,
  required,
}: {
  name: string;
  kind: AiAssistKind;
  rows?: number;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function generate() {
    const form = wrapRef.current?.closest("form");
    const field = (n: string) => {
      const el = form?.elements.namedItem(n);
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
        return el.value.trim();
      if (el instanceof HTMLSelectElement)
        return el.selectedOptions[0]?.text?.trim() ?? "";
      return "";
    };
    const title = field("title");
    const course = field("courseId");
    const seed = value.trim();

    if (!title && !seed) {
      setError("Type a title or topic first, then click Generate with AI.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, course, seed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.text) {
        setError(data.error ?? "AI could not generate — write your own instead.");
      } else {
        setValue(data.text);
        setAiDraft(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function writeOwn() {
    setValue("");
    setAiDraft(false);
    setError(null);
  }

  return (
    <div ref={wrapRef}>
      <Textarea
        name={name}
        rows={rows}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          setAiDraft(false);
        }}
      />
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
          {loading ? "Generating…" : aiDraft ? "Regenerate with AI" : "Generate with AI"}
        </button>
        {value && (
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
            AI draft — edit it freely or regenerate
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
