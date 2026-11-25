import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AI_TOOLS } from "@/lib/ai-tools";
import { AiToolsDirectory } from "./AiToolsDirectory";

export const metadata = {
  title: "Free AI Tools Directory · Video, Image, Voice, Coding & More · SkillTek",
  description:
    "100+ of the best AI tools in one place — ChatGPT, Claude, Gemini, Sora, Midjourney, ElevenLabs, n8n, Cursor and more — sorted by category, from SkillTek Institute, Thatta.",
  alternates: { canonical: "/ai-tools" },
};

export default function AiToolsPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[130px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-16 text-center lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> {AI_TOOLS.length}+ AI tools
          </p>
          <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Every AI tool
            <span className="block bg-gradient-to-r from-sky-400 via-brand-400 to-indigo-300 bg-clip-text text-transparent">
              you need, one place
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-slate-400">
            The best AI tools for video, images, voice, writing, coding and
            automation — hand-picked by SkillTek trainers. Search, pick a
            category and open any tool on its official website.
          </p>
        </div>
      </section>

      <AiToolsDirectory />

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            Learn at SkillTek
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Don&apos;t just use AI tools — build your own
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-400">
            In our Agentic AI &amp; Automation course you build real AI agents
            and automations with tools like n8n, Claude and ChatGPT — hands-on,
            in Thatta.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://agenticai.theskilltek.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Agentic AI course <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-brand-400"
            >
              All programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
