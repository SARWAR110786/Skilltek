import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/page-hero";
import { StoryCard } from "@/components/story-card";
import { SocialButtons } from "@/components/social-links";

export const metadata = {
  title: "Student Success Stories · SkillTek Institute, Thatta",
  description:
    "Watch SkillTek students share how our IT and AI courses in Thatta helped them learn real skills, start freelancing and grow their careers.",
  alternates: { canonical: "/testimonials" },
};

export const instant = false;

async function getStories() {
  try {
    await connection();
    return await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, role: true, quote: true, youtubeId: true, featured: true },
    });
  } catch {
    return [];
  }
}

export default async function TestimonialsPage() {
  const stories = await getStories();

  return (
    <div>
      <PageHero
        eyebrow="Success Stories"
        title="Hear it from our students"
        subtitle="Real SkillTek students sharing what they learned and where it took them."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        {stories.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-lg font-semibold text-white">Student stories are coming soon</p>
            <p className="mt-2 text-sm text-slate-400">
              Meanwhile, see our students&apos; work and updates on our social pages.
            </p>
            <SocialButtons className="mt-6 justify-center" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-brand-400/20 bg-brand-600/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Your story could be next</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            Join a SkillTek program and learn practical IT and AI skills in Thatta.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/admissions" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:border-brand-400">
              View programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
