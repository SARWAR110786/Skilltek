"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui";
import { cn } from "@/lib/utils";

// Kept here (not imported from lib/challan) so no server code ends up in the
// browser bundle.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Yearly / Monthly switch + year (+ month) pickers; navigates on change. */
export function ReportFilter({
  view,
  year,
  month,
  years,
  basePath = "/admin/reports",
  showViewToggle = true,
  courses,
  course = "",
}: {
  view: "year" | "month";
  year: number;
  month: number;
  years: number[];
  basePath?: string;
  showViewToggle?: boolean;
  /** Optional course picker ("" = all courses). */
  courses?: { id: string; title: string }[];
  course?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(next: {
    view?: "year" | "month";
    year?: number;
    month?: number;
    course?: string;
  }) {
    const v = next.view ?? view;
    const qs = new URLSearchParams({
      year: String(next.year ?? year),
      month: String(next.month ?? month),
    });
    if (showViewToggle) qs.set("view", v);
    const c = next.course ?? course;
    if (courses && c) qs.set("course", c);
    startTransition(() => router.push(`${basePath}?${qs}`));
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-60")}>
      {courses && (
        <Select
          aria-label="Course"
          value={course}
          onChange={(e) => go({ course: e.target.value })}
          className="!w-auto !py-1.5 text-xs"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
      )}
      {showViewToggle && (
      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
        {(["month", "year"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => go({ view: v })}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              view === v ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {v === "month" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      )}
      {(view === "month" || !showViewToggle) && (
        <Select
          aria-label="Month"
          value={String(month)}
          onChange={(e) => go({ month: Number(e.target.value) })}
          className="!w-auto !py-1.5 text-xs"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </Select>
      )}
      <Select
        aria-label="Year"
        value={String(year)}
        onChange={(e) => go({ year: Number(e.target.value) })}
        className="!w-auto !py-1.5 text-xs"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
