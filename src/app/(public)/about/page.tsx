import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "About â€” SkillTek" };

const PILLARS = [
  { title: "Our Mission", text: "Deliver practical, affordable and modern education." },
  { title: "Our People", text: "Passionate teachers and a supportive community." },
  { title: "Our Promise", text: "Quality learning, measurable results." },
];

const FOUNDERS = [
  {
    name: "Sarfaraz Ahmed",
    role: "Founder / CEO",
    image: "/founders/founder.jpg",
    tagline:
      "Experienced IT Instructor, Trainer, Educationist & Marketing Professional · Social & Youth Activist",
    bio: [
      "With a strong background in IT, education, marketing and social activism, Sarfaraz is dedicated to leveraging his expertise to drive organizational success and community development. As a passionate educator and trainer, he empowers individuals through skill-building and mentorship, backed by a proven track record in youth development and community engagement.",
      "Over the years, he has worked closely with various organizations to design impactful programs that enhance career opportunities and build leadership skills for young people. He has led initiatives that inspire, educate and motivate the next generation to realize their potential and contribute positively to society.",
      "His work extends beyond the classroom: he aims to create meaningful change in the community by fostering collaboration and advocating for youth empowerment.",
    ],
    linkedin: "https://www.linkedin.com/in/sarfarazahmed07/",
  },
  {
    name: "Sarwar Ali",
    role: "Co Founder / CTO",
    image: "/founders/Co-Founder.jpeg",
    tagline: "Data Scientist, AI Enthusiast · Automation + Agentic AI Developer · IT Trainer",
    bio: [
      "Sarwar Ali is a Data Scientist and AI enthusiast focused on automation and agentic AI development. He designs intelligent workflows and AI-powered systems that solve real-world problems, and shares that expertise as an IT trainer.",
      "At SkillTek, he leads the technology and curriculum direction, helping students build hands-on, job-ready skills in data, AI and modern software. His goal is to make advanced technology practical, accessible and useful for the next generation.",
    ],
    linkedin: "https://www.linkedin.com/in/sarwar-ali-6991b1277/",
  },
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

      <section className="border-t border-white/10 bg-slate-950/40">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              Leadership
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Meet Our Founders
            </h2>
            <p className="mt-3 leading-relaxed text-slate-400">
              The people behind SkillTek, committed to building practical
              education that changes lives.
            </p>
          </div>

          <div className="mt-12 space-y-8">
            {FOUNDERS.map((f, i) => (
              <Reveal key={f.name} delay={i * 100}>
                <article className="group grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-brand-500/40 md:grid-cols-[300px_1fr]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 md:aspect-auto md:h-full">
                    <Image
                      src={f.image}
                      alt={f.name}
                      fill
                      sizes="(min-width: 768px) 300px, 100vw"
                      className="object-cover object-top transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 lg:p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                      {f.role}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {f.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-300">
                      {f.tagline}
                    </p>
                    <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
                      {f.bio.map((paragraph) => (
                        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                      ))}
                    </div>
                    <a
                      href={f.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
                    >
                      View LinkedIn Profile
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
