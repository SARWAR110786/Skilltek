import { connection } from "next/server";
import { CheckCircle2 } from "lucide-react";
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
  "Submit the online admission enquiry form.",
  "Our team calls you to discuss the course and details.",
  "Visit the institute with documents and complete enrollment.",
  "Get your student portal login and start learning!",
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
            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Admission Enquiry
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill in your details and we will get back to you.
              </p>
              <div className="mt-6">
                <EnquiryForm courses={courses} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
