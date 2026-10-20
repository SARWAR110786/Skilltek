import Image from "next/image";
import Link from "next/link";
import {
  BellRing,
  GraduationCap,
  LayoutGrid,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { InstallApp } from "@/components/install-app";

export const metadata = {
  title: "Download the App · SkillTek",
  description:
    "Install the SkillTek app on Android or iPhone for one-tap access to classes, results, challans and notices.",
};

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Student Portal",
    text: "Attendance, quizzes, assignments and results — always one tap away.",
  },
  {
    icon: BellRing,
    title: "Instant Notices",
    text: "Get institute announcements and fee reminders without opening a browser.",
  },
  {
    icon: LayoutGrid,
    title: "Full-Screen App",
    text: "No address bar, no tabs — it opens and feels like a native app.",
  },
  {
    icon: Wifi,
    title: "Works Offline",
    text: "Pages you have already opened stay available even on a weak connection.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Official",
    text: "Served straight from skilltek-cg41.vercel.app — no third-party stores.",
  },
  {
    icon: Sparkles,
    title: "Always Up to Date",
    text: "The app loads the latest version automatically. No manual updates.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Open the SkillTek site",
    text: "On your phone, go to skilltek-cg41.vercel.app in Chrome (Android) or Safari (iPhone).",
  },
  {
    n: "02",
    title: "Tap install",
    text: "Choose Android to install instantly, or use the ⋮ / Share menu and pick “Add to Home screen”.",
  },
  {
    n: "03",
    title: "Launch from home screen",
    text: "The SkillTek icon appears with your other apps. Open it any time — no browser needed.",
  },
];

export default function DownloadPage() {
  return (
    <div>
      <PageHero
        eyebrow="Get the App"
        title="SkillTek on your phone"
        subtitle="Install the SkillTek portal as an app for one-tap access to classes, results, challans and notices."
      />

      <section className="mx-auto max-w-6xl px-4 py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
                <Smartphone className="h-3.5 w-3.5" /> Android &amp; iOS
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Install in seconds
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-slate-400">
                The SkillTek app is a lightweight installable web app. Nothing to
                download from a store, no account needed — just tap and it lives on
                your home screen like any other app.
              </p>

              <div className="mt-7">
                <InstallApp />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    APK file size
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">~1.9 MB — very light</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Android support
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">Android 7.0 and above</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-xs">
              <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-brand-600/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-slate-900 p-3 shadow-2xl">
                <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/15" />
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-950">
                  <div className="flex items-center justify-center border-b border-white/10 bg-white/[0.03] px-4 py-5">
                    <Image
                      src="/logos/main-logo.png"
                      alt="SkillTek Institute"
                      width={2172}
                      height={724}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    {["Courses", "Student Portal", "Results"].map((label, i) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-200">{label}</span>
                        <span className="h-8 w-8 rounded-lg bg-brand-600/25" />
                      </div>
                    ))}
                    <div className="rounded-xl border border-brand-500/30 bg-brand-600/10 px-4 py-3 text-center text-xs font-medium text-brand-200">
                      SkillTek app installed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Why install the app
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            Everything you already use in the portal, packaged for your phone.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-slate-950/60 p-5 transition-colors hover:border-brand-500/40 hover:bg-white/[0.04]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15 text-brand-300">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:py-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          How to install
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="h-full">
              <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="text-3xl font-bold text-brand-500/40">{s.n}</span>
                <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-14 overflow-hidden rounded-3xl border border-brand-500/25 bg-gradient-to-br from-brand-600/20 via-slate-950 to-slate-950 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Install the app now, or open the student portal in your browser.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                Go to Student Portal
              </Link>
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Apply for Admission
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
