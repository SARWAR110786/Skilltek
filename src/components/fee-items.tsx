"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";

const FEES = [
  "Monthly Fee",
  "Admission Fee",
  "ID Card Fee",
  "Exam Fee",
  "Registration Fee",
  "Certificate Fee",
  "Transport Fee",
  "Other",
];

const OTHER = "__other__";

type Row = { key: number; label: string; custom: string; amount: string };

export function FeeItems() {
  const [rows, setRows] = useState<Row[]>([
    { key: 0, label: "Monthly Fee", custom: "", amount: "" },
  ]);
  const [next, setNext] = useState(1);

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  function add() {
    setRows((r) => [...r, { key: next, label: "", custom: "", amount: "" }]);
    setNext((n) => n + 1);
  }

  function remove(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          {row.label === OTHER ? (
            <>
              <div className="min-w-0 flex-1">
                <Input
                  name="feeLabel"
                  value={row.custom}
                  onChange={(e) => update(row.key, { custom: e.target.value })}
                  placeholder="Type fee name (e.g. Library Fee)"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => update(row.key, { label: "", custom: "" })}
                className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Use list
              </button>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <Select
                name="feeLabel"
                value={row.label}
                onChange={(e) => update(row.key, { label: e.target.value, custom: "" })}
              >
                <option value="">Select fee type…</option>
                {FEES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="w-24 shrink-0">
            <Input
              type="number"
              min={0}
              step="any"
              name="feeAmount"
              value={row.amount}
              onChange={(e) => update(row.key, { amount: e.target.value })}
              placeholder="Amount"
              className="text-right"
            />
          </div>

          <button
            type="button"
            onClick={add}
            aria-label="Add another fee"
            title="Add another fee"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-200 text-lg leading-none text-brand-600 transition hover:bg-brand-50"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => remove(row.key)}
            disabled={rows.length === 1}
            aria-label="Remove fee"
            title="Remove"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-lg leading-none text-slate-500 transition hover:bg-slate-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">
          Choose a fee type, enter the amount, or use + to add another fee.
        </span>
        <span className="text-sm font-medium text-slate-600">
          Total: {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
