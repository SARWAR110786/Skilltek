"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock, X } from "lucide-react";
import { RichText } from "@/lib/rich-text";

/**
 * "More info" button for a program card. Cards show a short, clamped
 * description so they all have the same size; this opens the full details.
 *
 * The popup is drawn straight into <body> (a portal): the cards sit inside an
 * animated wrapper whose CSS transform would otherwise trap a fixed popup
 * inside the card instead of covering the screen.
 */
export function ProgramInfo({
  title,
  description,
  durationMonths,
  code,
  startLabel,
  endLabel,
  website,
}: {
  title: string;
  description: string;
  durationMonths: number;
  code?: string | null;
  startLabel?: string | null;
  endLabel?: string | null;
  website?: { url: string; label: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

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

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900 text-left shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
      >
        {/* Header stays put while the details scroll */}
        <div className="flex items-start gap-4 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Program{code ? ` · ${code}` : ""}
            </p>
            <h3 id={titleId} className="mt-1.5 break-words text-xl font-bold text-white sm:text-2xl">
              {title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-brand-400" />
                {durationMonths} month{durationMonths === 1 ? "" : "s"}
              </span>
              {(startLabel || endLabel) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                  {startLabel ?? "?"} – {endLabel ?? "?"}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 text-sm leading-relaxed text-slate-300 sm:p-6">
          {website && (
            <a
              href={website.url}
              target="_blank"
              rel="noopener"
              className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-3 text-brand-200 transition-colors hover:bg-brand-500/20"
            >
              <span>
                <span className="block text-xs uppercase tracking-wider text-brand-300">Full course website</span>
                <span className="font-semibold text-white">{website.label}</span>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          )}
          <RichText text={description} className="break-words" />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 p-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
          {website && (
            <a
              href={website.url}
              target="_blank"
              rel="noopener"
              className="rounded-lg border border-brand-400/40 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/15"
            >
              Visit course website
            </a>
          )}
          <Link
            href="/admissions"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Apply now
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-brand-400 hover:bg-brand-600/20 hover:text-white"
      >
        More info
      </button>
      {open && mounted && createPortal(dialog, document.body)}
    </>
  );
}
