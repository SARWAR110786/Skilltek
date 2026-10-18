"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Maximize, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";

export function QuizRunner({
  action,
  quizId,
  durationMinutes,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  quizId: string;
  durationMinutes: number;
  children: React.ReactNode;
}) {
  const [started, setStarted] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const formRef = useRef<HTMLFormElement>(null);
  const violatedRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef(false);

  function endQuiz(reason: string | null) {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (reason) {
      setBlocked(reason);
      if (violatedRef.current) violatedRef.current.value = "1";
    }
    window.setTimeout(() => formRef.current?.requestSubmit(), 400);
  }

  useEffect(() => {
    if (!started) return;
    activeRef.current = true;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) endQuiz("You left full-screen mode.");
    };
    const onVisibility = () => {
      if (document.hidden) endQuiz("You switched away from the quiz tab.");
    };
    const onBlur = () => endQuiz("You changed to another window.");

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          endQuiz(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.clearInterval(timer);
    };
  }, [started]);

  async function start() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* full-screen may be blocked by the browser; continue anyway */
    }
    setStarted(true);
  }

  if (!started) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-slate-800">Quiz Mode</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          This quiz runs in a protected full-screen mode. Once you start, leaving full-screen
          or switching tabs/windows will <strong>end and submit</strong> your quiz immediately.
          Make sure you are ready before you begin.
        </p>
        <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-slate-600">
          <li>• Duration: {durationMinutes} minute{durationMinutes === 1 ? "" : "s"}</li>
          <li>• Stay in full-screen until you submit.</li>
          <li>• Do not switch tabs or windows.</li>
        </ul>
        <Button type="button" onClick={start} className="mt-6">
          <Maximize className="h-4 w-4" /> Start Quiz
        </Button>
      </div>
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="quizId" value={quizId} />
      <input ref={violatedRef} type="hidden" name="violated" defaultValue="0" />

      <div className="sticky top-0 z-30 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white shadow-lg">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Quiz in progress
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
        </span>
      </div>

      {blocked && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Quiz ended</p>
            <p className="text-sm">{blocked} The quiz was submitted and marked as a violation.</p>
          </div>
        </div>
      )}

      <div className={blocked ? "pointer-events-none opacity-50" : undefined}>
        {children}
        <div className="mt-5">
          <Button type="submit" className="w-full sm:w-auto">
            <Maximize className="h-4 w-4" /> Submit Quiz
          </Button>
        </div>
      </div>
    </form>
  );
}
