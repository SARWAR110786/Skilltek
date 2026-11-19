"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Field, Input } from "@/components/ui";
import { MAX_COURSE_MONTHS, courseDays, courseMonths } from "@/lib/course-duration";
import { cn } from "@/lib/utils";

/** Start / end date inputs that show the course duration as you pick. */
export function CourseDates({
  defaultStart = "",
  defaultEnd = "",
  fallbackMonths,
}: {
  defaultStart?: string;
  defaultEnd?: string;
  /** Shown for an older course that has no dates yet. */
  fallbackMonths?: number;
}) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const months = courseMonths(start, end);
  const days = courseDays(start, end);
  const backwards = !!start && !!end && months == null;
  const tooLong = months != null && months > MAX_COURSE_MONTHS;

  let text: string;
  if (backwards) text = "The end date can't be before the start date.";
  else if (tooLong) text = `That is ${months} months — a course can be at most ${MAX_COURSE_MONTHS} months.`;
  else if (months != null) text = `Duration: ${months} month${months === 1 ? "" : "s"} (${days} days)`;
  else if (fallbackMonths && !start && !end)
    text = `Currently ${fallbackMonths} month${fallbackMonths === 1 ? "" : "s"} — pick the dates to set it.`;
  else text = "Pick both dates to see the duration.";

  return (
    <>
      <Field label="Start date" required>
        <Input
          name="startDate"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
        />
      </Field>
      <Field label="End date" required>
        <Input
          name="endDate"
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => setEnd(e.target.value)}
          required
        />
      </Field>
      <p
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm md:col-span-2",
          backwards || tooLong
            ? "bg-rose-50 text-rose-700"
            : months != null
              ? "bg-brand-50 font-medium text-brand-700"
              : "bg-slate-50 text-slate-500",
        )}
        aria-live="polite"
      >
        <CalendarRange className="h-4 w-4 shrink-0" />
        {text}
      </p>
    </>
  );
}
