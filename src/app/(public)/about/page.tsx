import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "About · SkillTek" };

const PILLARS = [
  { title: "Our Mission", text: "Deliver practical, affordable and modern education." },
  { title: "Our People", text: "Passionate teachers and a supportive community." },
  { title: "Our Promise", text: "Quality learning, measurable results." },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About Us"
        title="About SkillTek"
        subtitle="We are dedicated to empowering individuals with practical skills and knowledge that transform careers and communities."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Our Story</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              SkillTek Institute was founded with a simple mission: to make
              quality, industry-relevant education accessible to everyone. Our
              experienced faculty, modern curriculum and digital-first approach
              ensure every student gets the best learning experience.
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              From admissions to graduation, we use technology to keep students,
              teachers and administrators connected on a single powerful
              platform.
            </p>
            <Link
              href="/admissions"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-500"
            >
              Join Us
            </Link>
          </div>

          <div className="grid gap-5">
            {PILLARS.map((b, i) => (
              <Reveal key={b.title} delay={i * 100} className="h-full">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                  <h3 className="font-semibold text-white">{b.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
