import { connection } from "next/server";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { EnquiryForm } from "./EnquiryForm";

export const metadata = { title: "Admissions · SkillTek" };

// Reads live data through connection(); allow this segment to block.
export const instant = false;

async function getCourses() {
  try {
    await connection();
    return await prisma.course.findMany({
      where: { active: true },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch {
    return [];
  }
}

const STEPS = [
  "Fill in the online admission form.",
  "Our team calls you to discuss the course and details.",
  "Visit the institute with documents and complete enrollment.",
  "Get your student portal login and start learning!",
];

const CONTACT = [
  {
    icon: MapPin,
    title: "Visit our campus",
    value: "Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street, Thatta",
  },
  { icon: Phone, title: "Call us", value: "0312 2098894", href: "tel:+923122098894" },
  { icon: Mail, title: "Email us", value: "theskilltek@gmail.com", href: "mailto:theskilltek@gmail.com" },
];

const DOCS = [
  "CNIC / B-Form copy",
  "Recent photographs",
  "Last qualification certificate",
];

export default async function AdmissionsPage() {
  const courses = await getCourses();

  return (
    <div>
      <PageHero
        eyebrow="Admissions"
        title="Admissions"
        subtitle="Take the first step towards a brighter future. Apply online in minutes."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-6 space-y-4">
              {STEPS.map((s, i) => (
                <Reveal key={i} delay={i * 90}>
                  <li className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-slate-400">{s}</p>
                  </li>
                </Reveal>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-semibold text-white">What you&apos;ll need</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                {DOCS.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Reveal delay={150}>
            <div
              id="apply"
              className="scroll-mt-28 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8"
            >
              <h2 className="text-xl font-bold text-white">Admission Form</h2>
              <p className="mt-1 text-sm text-slate-400">
                Fill in your details and we will get back to you.
              </p>
              <div className="mt-6">
                <EnquiryForm courses={courses} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------- Contact details (the old Contact page) -------- */}
      <section id="contact" className="scroll-mt-24 border-t border-white/10 bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Contact</p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Get in touch</h2>
            <p className="mt-3 text-slate-400">
              Questions about a program or your admission? Visit, call or email us.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CONTACT.map((c, i) => {
              const inner = (
                <div className="flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">{c.title}</p>
                    <p className="break-words font-medium text-white">{c.value}</p>
                  </div>
                </div>
              );
              return (
                <Reveal key={c.title} delay={i * 90} className="h-full">
                  {c.href ? (
                    <a href={c.href} className="block h-full">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
