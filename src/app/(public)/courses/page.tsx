import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "Courses · SkillTek" };

async function getCourses() {
  try {
    await connection();
    return await prisma.course.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { students: true } } },
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
                  <h3 className="text-lg font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-400">
                    {c.description ?? "Comprehensive training program."}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {c.durationMonths} months
                    </span>
                    <span>{c._count.students} students enrolled</span>
                  </div>
                  <div className="mt-5 flex items-center justify-end border-t border-white/10 pt-4">
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
