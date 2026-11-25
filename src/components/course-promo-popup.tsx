"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Layers, MapPin, Sparkles, Users, X } from "lucide-react";

// Agentic AI & Automation weekend batch announcement.
// Shows once per day per visitor and stops after the batch has started.
const PROMO_KEY = "promo-agentic-weekend-2026-12";
const SHOW_UNTIL = new Date("2026-12-08T00:00:00+05:00");
const DELAY_MS = 2500;

export function CoursePromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Date.now() > SHOW_UNTIL.getTime()) return;
    let seenToday = false;
    try {
      seenToday = localStorage.getItem(PROMO_KEY) === new Date().toDateString();
    } catch {}
    if (seenToday) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(PROMO_KEY, new Date().toDateString());
    } catch {}
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-brand-400/25 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl shadow-brand-900/40 sm:p-7"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[480px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[90px]" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative text-center">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> NEW WEEKEND BATCH
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3 w-3" /> Very limited seats
            </span>
          </div>
          <h2 id="promo-title" className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
            Join our{" "}
            <span className="bg-gradient-to-r from-sky-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">
              Agentic AI &amp; Automation
            </span>{" "}
            course
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400 sm:text-base">
            Build AI agents, automate workflows and create AI apps — with 14+ real projects.
          </p>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white">
          <img
            src="/promo/agentic-ai-weekend.jpg"
            alt="Agentic AI & Automation — weekend batch starting 1st December 2026 at SkillTek, Thatta"
            className="mx-auto max-h-[34vh] w-auto object-contain sm:max-h-[40vh]"
          />
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: CalendarDays, label: "Starts", value: "1 Dec 2026" },
            { icon: Layers, label: "Projects", value: "14+ real" },
            { icon: Users, label: "Batch", value: "Weekend" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand-300">
                <Icon className="h-3.5 w-3.5" /> {label}
              </p>
              <p className="mt-1 text-sm font-bold text-white sm:text-base">{value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admissions"
            onClick={close}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500"
          >
            Reserve my seat
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Maybe later
          </button>
        </div>

        <p className="relative mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Thatta, Sindh</span>
          <span>·</span>
          <a href="tel:03122098894" className="hover:text-white">0312-2098894</a>
          <span>·</span>
          <a href="https://agenticai.theskilltek.com" target="_blank" rel="noopener" className="text-brand-300 hover:text-brand-200">
            Course details ↗
          </a>
        </p>
      </div>
    </div>
  );
}
