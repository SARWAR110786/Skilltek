"use client";

import { useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";

export type PickerGroup = {
  key: string;
  label: string;
  items: { id: string; text: string; marks: number }[];
};

export function QuestionPicker({
  groups,
  initialSelected = [],
}: {
  groups: PickerGroup[];
  initialSelected?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const marks = groups.reduce(
    (s, g) => s + g.items.filter((q) => selected.has(q.id)).reduce((m, q) => m + q.marks, 0),
    0,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-brand-600" />
          Questions from bank
          <span
            className={
              selected.size > 0
                ? "rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
            }
          >
            {selected.size} selected{selected.size > 0 ? ` · ${marks} marks` : ""}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {g.label}
              </p>
              <div className="space-y-1">
                {g.items.map((q) => (
                  <label
                    key={q.id}
                    className="flex items-start gap-2 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      name="questionIds"
                      value={q.id}
                      checked={selected.has(q.id)}
                      onChange={() => toggle(q.id)}
                      className="mt-0.5 h-4 w-4 rounded"
                    />
                    <span>
                      {q.text}{" "}
                      <span className="text-xs text-slate-400">
                        ({q.marks} mark{q.marks === 1 ? "" : "s"})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {total === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">No questions available.</p>
          )}
        </div>
      )}
    </div>
  );
}
