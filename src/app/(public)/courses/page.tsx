import Link from "next/link";
import { plainText } from "@/lib/rich-text";
import { formatDate } from "@/lib/utils";
import { connection } from "next/server";
import { ArrowRight, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ProgramInfo } from "@/components/program-info";

export const metadata = { title: "Courses · SkillTek" };

// Reads live data through connection(); allow this segment to block.
export const instant = false;

async function getCourses() {
  try {
    await connection();
    return await prisma.course.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div>
      <PageHero
        eyebrow="Programs"
        title="Our Courses"
        subtitle="Industry-focused programs designed to make you job-ready."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        {courses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-slate-500">
            No courses published yet. Please check back soon.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <Reveal key={c.id} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                  {/* Fixed-height title and 3-line description keep every
                      card the same size; "More info" shows the full text. */}
                  <h3
                    className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-7 text-white"
                    title={c.title}
                  >
                    {c.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 min-h-[4.5rem] flex-1 text-sm leading-6 text-slate-400">
                    {plainText(c.description ?? "") || "Comprehensive training program."}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {c.durationMonths} months
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <ProgramInfo
                      title={c.title}
                      description={c.description ?? "Comprehensive training program."}
                      durationMonths={c.durationMonths}
                      code={c.code}
                      startLabel={c.startDate ? formatDate(c.startDate) : null}
                      endLabel={c.endDate ? formatDate(c.endDate) : null}
                    />
                    <Link
                      href="/admissions"
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 hover:text-brand-200"
                    >
                      Apply <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
