import { Award, Crown, Trophy } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { initials } from "@/lib/utils";
import type { PublishedStudent } from "@/lib/performance";

function Avatar({ s, size }: { s: PublishedStudent; size: "lg" | "sm" }) {
  const box = size === "lg" ? "h-24 w-24 text-2xl" : "h-14 w-14 text-base";
  if (s.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={s.avatarUrl}
        alt={s.name}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white/20`}
      />
    );
  }
  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-full font-bold ${
        size === "lg"
          ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950"
          : "bg-white/10 text-white"
      }`}
    >
      {initials(s.name)}
    </span>
  );
}

function Parts({ s }: { s: PublishedStudent }) {
  const parts = [
    ["Quizzes", s.quiz],
    ["Assignments", s.assignment],
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

/** Public "Top Performers of the Month" section (top 1 highlighted). */
export function TopStudents({
  students,
  period,
}: {
  students: PublishedStudent[];
  period: string;
}) {
  if (students.length === 0) return null;
  const [champion, ...rest] = students;

  return (
    <section className="relative border-b border-white/10">
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[560px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-400">
            <Trophy className="h-4 w-4" /> Top Performers · {period}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Our students of the month
          </h2>
          <p className="mt-4 text-slate-400">
            Ranked on quizzes, assignments and attendance. Congratulations to this month&apos;s
            achievers!
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-5">
          {/* ---------- #1, highlighted ---------- */}
          <Reveal className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-b from-amber-400/15 via-slate-950/80 to-slate-950 p-8 shadow-[0_0_60px_-15px_rgba(251,191,36,0.5)]">
              <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                <Crown className="h-3.5 w-3.5" /> #1 Student of the Month
              </span>
              <div className="mt-8 flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar s={champion} size="lg" />
                  <Crown className="absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 text-amber-400" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">{champion.name}</h3>
                {champion.courseTitle && (
                  <p className="mt-1 text-sm text-amber-200/80">{champion.courseTitle}</p>
                )}
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
          </Reveal>

          {/* ---------- #2 – #5 ---------- */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {rest.map((s, i) => (
              <Reveal key={`${s.rank}-${s.name}`} delay={(i + 1) * 90} className="h-full">
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40">
                  <div className="flex items-center gap-4">
                    <Avatar s={s} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                        <Award className="h-3.5 w-3.5" /> Rank #{s.rank}
                      </p>
                      <h3 className="truncate text-base font-semibold text-white" title={s.name}>
                        {s.name}
                      </h3>
                      {s.courseTitle && (
                        <p className="truncate text-xs text-slate-400">{s.courseTitle}</p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-white">{s.overall}</p>
                  </div>
                  <Parts s={s} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
