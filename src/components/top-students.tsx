"use client";

import { useState } from "react";
import { Award, Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublishedStudent } from "@/lib/performance";

export type WebsiteCourse = { courseTitle: string; period: string; students: PublishedStudent[] };

function Parts({ s }: { s: PublishedStudent }) {
  const parts = [
    ["Quizzes", s.quiz],
    ["Assignments", s.assignment],
    ["Assessments", s.assessment],
    ["Attendance", s.attendance],
  ] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {parts
        .filter(([, v]) => v != null)
        .map(([label, v]) => (
          <span
            key={label}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
          >
            {label} <span className="font-semibold text-white">{v}%</span>
          </span>
        ))}
    </div>
  );
}

/** Public "Top Performers of the Month" section: one tab per course, #1 highlighted. */
export function TopStudents({ courses }: { courses: WebsiteCourse[] }) {
  const [active, setActive] = useState(0);
  if (courses.length === 0) return null;
  const current = courses[Math.min(active, courses.length - 1)];
  const [champion, ...rest] = current.students;

  return (
    <section className="relative border-b border-white/10">
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[560px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-400">
            <Trophy className="h-4 w-4" /> Top Performers · {current.period}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Our students of the month
          </h2>
          <p className="mt-4 text-slate-400">
            The best students of every course, ranked on quizzes, assignments, assessments and
            attendance.
            Congratulations to this month&apos;s achievers!
          </p>
        </div>

        {/* ---------- Course tabs ---------- */}
        {courses.length > 1 && (
          <div role="tablist" aria-label="Courses" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
            {courses.map((c, i) => (
              <button
                key={c.courseTitle}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  i === active
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white",
                )}
              >
                {c.courseTitle}
              </button>
            ))}
          </div>
        )}

        <div key={current.courseTitle} className="mt-8 grid gap-5 lg:grid-cols-5">
          {/* ---------- #1, highlighted ---------- */}
          <div className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-b from-amber-400/15 via-slate-950/80 to-slate-950 p-8 shadow-[0_0_60px_-15px_rgba(251,191,36,0.5)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                <Crown className="h-3.5 w-3.5" /> #1 Student of the Month
              </span>
              <div className="mt-8 flex flex-col items-center text-center">
                <h3 className="text-3xl font-bold text-white">{champion.name}</h3>
                <p className="mt-1 text-sm text-amber-200/80">{current.courseTitle}</p>
                <p className="mt-6 text-5xl font-extrabold text-amber-300">
                  {champion.overall}
                  <span className="text-lg font-semibold text-amber-200/70"> / 100</span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                  Overall score
                </p>
                <div className="mt-6 flex justify-center">
                  <Parts s={champion} />
                </div>
              </div>
            </div>
          </div>

          {/* ---------- #2 – #5 ---------- */}
          <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-3">
            {rest.map((s) => (
              <div
                key={`${s.rank}-${s.name}`}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40"
              >
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                      <Award className="h-3.5 w-3.5" /> Rank #{s.rank}
                    </p>
                    <h3 className="truncate text-base font-semibold text-white" title={s.name}>
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-white">{s.overall}</p>
                </div>
                <Parts s={s} />
              </div>
            ))}
            {rest.length === 0 && (
              <p className="text-sm text-slate-500">Only one student is ranked in this course.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
