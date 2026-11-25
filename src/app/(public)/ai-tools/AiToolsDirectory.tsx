"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { AI_TOOLS, AI_TOOL_CATEGORIES } from "@/lib/ai-tools";
import { cn } from "@/lib/utils";

const PAGE = 24;

const BADGE_STYLE: Record<string, string> = {
  Trending: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  Popular: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  "Free plan": "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  New: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  "Taught at SkillTek": "bg-brand-500/20 text-brand-200 border-brand-400/40",
};

// The tool's own site icon (its logo), with the first letter as a fallback.
function ToolLogo({ name, url }: { name: string; url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-lg font-bold text-white">
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`}
        alt={`${name} logo`}
        width={32}
        height={32}
        loading="lazy"
        onError={() => setFailed(true)}
        onLoad={(e) => {
          // Google returns a 16px grey globe when a site has no icon.
          if (e.currentTarget.naturalWidth <= 16) setFailed(true);
        }}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function host(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function AiToolsDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: AI_TOOLS.length };
    for (const t of AI_TOOLS) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AI_TOOLS.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (!q ||
          `${t.name} ${t.text} ${t.category} ${t.tags.join(" ")}`
            .toLowerCase()
            .includes(q)),
    );
  }, [query, category]);

  const visible = filtered.slice(0, shown);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 lg:pb-20">
      <div className="mx-auto max-w-xl">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder={`Search ${AI_TOOLS.length}+ AI tools…`}
            aria-label="Search AI tools"
            className="w-full rounded-full border border-white/15 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        Explore categories
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {["All", ...AI_TOOL_CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setShown(PAGE);
            }}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              category === c
                ? "border-brand-400 bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-brand-400/50 hover:text-white",
            )}
          >
            {c === "All" ? "All tools" : c}
            <span className="ml-1.5 text-xs opacity-60">{counts[c] ?? 0}</span>
          </button>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        Showing {visible.length} of {filtered.length} tools
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
          No tools match “{query}”. Try another word or pick “All tools”.
        </p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener nofollow"
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolLogo name={t.name} url={t.url} />
                  <div>
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    <p className="text-xs text-slate-500">{host(t.url)}</p>
                  </div>
                </div>
                {t.badge && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      BADGE_STYLE[t.badge],
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                {t.text}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white transition group-hover:border-brand-400 group-hover:bg-brand-600">
                Try tool <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      )}

      {shown < filtered.length && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE)}
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand-400 hover:bg-brand-600/20"
          >
            Load more tools ({filtered.length - shown} remaining)
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-500">
        Each tool opens on its own official website. SkillTek is not affiliated
        with these companies; prices and free plans may change.
      </p>
    </section>
  );
}
