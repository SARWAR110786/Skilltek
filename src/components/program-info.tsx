"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

/**
 * "More info" button for a program card. Cards show a short, clamped
 * description so they all have the same size; this opens the full details.
 */
export function ProgramInfo({
  title,
  description,
  durationMonths,
  code,
}: {
  title: string;
  description: string;
  durationMonths: number;
  code?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-brand-400 hover:bg-brand-600/20 hover:text-white"
      >
        More info
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 text-left shadow-2xl sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Program{code ? ` · ${code}` : ""}
            </p>
            <h3 id={titleId} className="mt-2 text-2xl font-bold text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Duration: {durationMonths} month{durationMonths === 1 ? "" : "s"}
            </p>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Close
              </button>
              <Link
                href="/admissions"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Apply now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
