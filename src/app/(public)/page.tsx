import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ChatWidget } from "@/components/chat-widget";
import { Reveal } from "@/components/reveal";
import { ProgramInfo } from "@/components/program-info";
import { Typewriter } from "@/components/typewriter";
import { EnquiryForm } from "@/app/(public)/admissions/EnquiryForm";
import { SERVICES } from "@/lib/services";

export const instant = false;

async function getData() {
  try {
    await connection();
    const [courses, studentCount, courseCount] = await Promise.all([
      prisma.course.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.student.count(),
      prisma.course.count(),
    ]);
    return { courses, studentCount, courseCount };
  } catch {
    return { courses: [], studentCount: 0, courseCount: 0 };
  }
}

const FEATURES = [
  {
    title: "Qualified Faculty",
    text: "Learn from experienced and certified instructors dedicated to student success.",
  },
  {
    title: "Practical Curriculum",
    text: "Industry-aligned programs that are reviewed and updated on a regular cycle.",
  },
  {
    title: "Modern Campus",
    text: "Purpose-built classrooms and labs that support focused, hands-on learning.",
  },
  {
    title: "Career & Placement",
    text: "Guidance and placement support to help graduates start their careers strong.",
  },
  {
    title: "Digital Student Portal",
    text: "A dedicated portal where students stay connected to notices and their course.",
  },
  {
    title: "24/7 Assistance",
    text: "An AI assistant answers admission, program and tech-solution queries at any hour.",
  },
];

const TRUST = [
  "Affiliated Programs",
  "Certified Faculty",
  "Modern Campus",
  "Placement Support",
];

const ADMISSION_CONTACT = [
  {
    title: "Visit our campus",
    text: "Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street, Thatta.",
  },
  { title: "Call our admissions desk", text: "0312 2098894" },
  { title: "Email us", text: "theskilltek@gmail.com" },
];

export default async function HomePage() {
  const { courses } = await getData();

  return (
    <div className="relative">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[130px]" />

        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              Admissions Open
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              <Typewriter
                prefix="Learn today, "
                accent="lead tomorrow."
                accentClassName="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent"
              />
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              SkillTek Institute delivers quality education through
              industry-aligned programs, experienced faculty and a fully digital
              campus — supporting students from admission to graduation.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/admissions"
                className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                Apply for Admission
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
              >
                Explore Programs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-6">
              {TRUST.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-2 text-sm text-slate-400"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================= FEATURES =========================== */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            Why SkillTek
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            An education designed around your future
          </h2>
          <p className="mt-4 text-slate-400">
            Every part of our institute is built to help students learn
            effectively and graduate career-ready.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90} className="h-full">
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                <h3 className="text-base font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================ PROGRAMS ============================ */}
      <section className="relative border-y border-white/10 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                Our Programs
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Popular courses &amp; diplomas
              </h2>
              <p className="mt-4 text-slate-400">
                Explore our most in-demand programs, taught by expert faculty.
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
            >
              View all programs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-500">
              No programs are published yet. Please check back soon.
            </div>
          ) : (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, i) => (
                <Reveal key={c.id} delay={i * 90} className="h-full">
                  <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-950/60 p-6 transition-colors hover:border-brand-500/40">
                    <h3
                      className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-6 text-white"
                      title={c.title}
                    >
                      {c.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-[3rem] flex-1 text-sm leading-6 text-slate-400">
                      {c.description ?? "Comprehensive training program."}
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {c.durationMonths} months program
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <ProgramInfo
                        title={c.title}
                        description={c.description ?? "Comprehensive training program."}
                        durationMonths={c.durationMonths}
                        code={c.code}
                      />
                      <Link
                        href="/admissions"
                        className="inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white"
                      >
                        Apply now <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================= TECH SOLUTIONS ========================= */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                SkillTek Media Solutions
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                We also build &amp; grow your business
              </h2>
              <p className="mt-4 text-slate-400">
                Beyond education, we deliver tech solutions — website
                development, digital marketing, AI automation, business
                automation and more.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
            >
              View all services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={i * 90} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                  <h3 className="text-base font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {s.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/services#contact"
              className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
            >
              Contact us
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* ============================ ADMISSIONS ========================== */}
      <section className="relative border-t border-white/10 bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              Admissions
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Start your application today
            </h2>
            <p className="mt-4 max-w-lg text-slate-400">
              Submit an enquiry and our admissions team will guide you through
              program selection, eligibility and enrollment.
            </p>

            <div className="mt-8 space-y-4">
              {ADMISSION_CONTACT.map((item, i) => (
                <Reveal
                  key={item.title}
                  delay={i * 110}
                  className="border-l-2 border-brand-500/50 pl-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
              <h3 className="text-lg font-semibold text-white">
                Admission Enquiry
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Fill in your details and we will get back to you.
              </p>
              <div className="mt-6">
                <EnquiryForm
                  courses={courses.map((c) => ({ id: c.id, title: c.title }))}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =============================== CTA ============================== */}
      <section className="relative border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-600/20 via-slate-900/40 to-slate-900/40 px-8 py-10 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Ready to begin your journey?
                </h2>
                <p className="mt-1 text-slate-400">
                  Applications for the Fall 2026 intake are now open.
                </p>
              </div>
              <Link
                href="/admissions"
                className="group inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                Apply Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
}
