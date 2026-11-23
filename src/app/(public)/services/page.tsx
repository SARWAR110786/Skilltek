import { CheckCircle2, Clock, Handshake, LifeBuoy, Lock, MessageSquare, Rocket, ClipboardList, Hammer } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SERVICES } from "@/lib/services";
import { EnquiryForm } from "@/app/(public)/admissions/EnquiryForm";
import { SocialButtons } from "@/components/social-links";

export const metadata = {
  title: "Website Development, Digital Marketing & AI Automation · SkillTek",
  description:
    "SkillTek Media Solutions builds websites, mobile apps and AI automation and runs digital marketing and branding for businesses in Thatta and across Pakistan.",
  alternates: { canonical: "/services" },
};

const POINTS = [
  "Free consultation & project scoping",
  "Clear quotes with defined timelines",
  "Ongoing support after delivery",
];

const PROMISES = [
  { icon: Lock, title: "Your privacy, protected", text: "We never publish a client's name, logo or project details without written permission." },
  { icon: Handshake, title: "Clear quote, no surprises", text: "You get a written scope and price before any work starts." },
  { icon: Clock, title: "On-time delivery", text: "Agreed milestones and regular progress updates throughout the project." },
  { icon: LifeBuoy, title: "Support after launch", text: "We stay with you after delivery for fixes, changes and guidance." },
];

const STEPS = [
  { icon: MessageSquare, title: "Discuss", text: "Free consultation to understand your business and goals." },
  { icon: ClipboardList, title: "Plan & quote", text: "A clear scope, timeline and price." },
  { icon: Hammer, title: "Build", text: "We design and develop with regular check-ins." },
  { icon: Rocket, title: "Launch & support", text: "Go live, then ongoing help as you grow." },
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

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              Why clients trust us
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Confidential work, clear results
            </h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              Many of our clients prefer to keep their projects private — and we
              respect that. Here is what every client can count on.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <h3 className="mt-16 text-xl font-bold text-white">How we work</h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 80} className="h-full">
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <span className="absolute right-5 top-5 text-3xl font-extrabold text-white/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <s.icon className="h-6 w-6 text-brand-400" />
                  <p className="mt-4 font-semibold text-white">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
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

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">See our latest work</p>
              <p className="mt-1 text-sm text-slate-400">
                Follow our page for recent projects, client results and updates.
              </p>
              <SocialButtons className="mt-4" />
            </div>
          </div>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
              <h2 className="text-xl font-bold text-white">
                Request a solution
              </h2>
              <p className="mt-1 text-sm text-slate-400">
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
