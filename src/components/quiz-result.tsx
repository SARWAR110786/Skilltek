"use client";

import Link from "next/link";
import { Trophy, Sparkles, CheckCircle2, XCircle } from "lucide-react";

export function QuizResult({ score, total, violated }: { score: number; total: number; violated: boolean }) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = !violated && percent >= 50;

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-white shadow-xl">
          <Trophy className="h-14 w-14" />
        </div>
        <Sparkles className="absolute -right-2 top-1 h-6 w-6 text-amber-400 animate-pulse" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Quiz Complete</h1>
        <p className="mt-2 text-slate-500">
          {violated ? "Quiz was ended due to violation (switched away/full-screen exit)." : passed ? "Well done! You passed this quiz." : "Keep practicing — you can do better next time."}
        </p>
      </div>
      <div className="grid w-full max-w-sm gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{score}/{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Percentage</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{percent}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Result</p>
          <p className={`mt-1 flex items-center justify-center gap-1 text-lg font-semibold ${violated ? "text-rose-600" : passed ? "text-emerald-600" : "text-amber-600"}`}>
            {violated ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            {violated ? "Violated" : passed ? "Passed" : "Low"}
          </p>
        </div>
      </div>
      <Link
        href="/student/quizzes"
        className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Back to Quizzes
      </Link>
    </div>
  );
}
