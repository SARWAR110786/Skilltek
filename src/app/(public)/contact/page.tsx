import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { EnquiryForm } from "../admissions/EnquiryForm";

export const metadata = { title: "Contact · SkillTek" };

const DETAILS = [
  {
    icon: MapPin,
    title: "Address",
    value: "Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street, Thatta",
  },
  { icon: Phone, title: "Phone", value: "0312 2098894" },
  { icon: Mail, title: "Email", value: "theskilltek@gmail.com" },
];

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Contact"
        title="Get in Touch"
        subtitle="Have a question? We'd love to hear from you — reach out and our team will respond shortly."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            {DETAILS.map((c, i) => (
              <Reveal key={c.title} delay={i * 90}>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-400">{c.title}</p>
                    <p className="font-medium text-white">{c.value}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
              <h2 className="text-xl font-bold text-white">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Fill in your details and we will get back to you.
              </p>
              <div className="mt-6">
                <EnquiryForm courses={[]} showCourse={false} compact />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
