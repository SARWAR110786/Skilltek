import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SERVICES } from "@/lib/services";
import { EnquiryForm } from "@/app/(public)/admissions/EnquiryForm";

export const metadata = { title: "Tech Solutions · SkillTek" };

const POINTS = [
  "Free consultation & project scoping",
  "Clear quotes with defined timelines",
  "Ongoing support after delivery",
];

export default function ServicesPage() {
  const serviceOptions = SERVICES.map((s) => s.title);

  return (
    <div>
      <PageHero
        eyebrow="SkillTek Media Solutions"
        title="Tech solutions for your business"
        subtitle="Beyond education, SkillTek builds and grows businesses — website development, digital marketing, AI automation, business automation and more."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 80} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                <h3 className="text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-slate-400">
          …and more. Tell us what you need and we&apos;ll help you build it.
        </p>
      </section>

      <section
        id="contact"
        className="relative scroll-mt-20 border-t border-white/10 bg-slate-900/40"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-start lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              Contact Us
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Let&apos;s build your next project
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-slate-400">
              Tell us about your business and the solution you need. Our team
              will get back to you with ideas and a clear plan.
            </p>

            <div className="mt-8 space-y-4">
              {POINTS.map((p, i) => (
                <Reveal key={p} delay={i * 110} className="border-l-2 border-brand-500/50 pl-4">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" />
                    {p}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Request a solution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill in your details and we will get back to you.
              </p>
              <div className="mt-6">
                <EnquiryForm
                  courses={[]}
                  showCourse={false}
                  serviceOptions={serviceOptions}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
