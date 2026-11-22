import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Check,
  Coins,
  Handshake,
  Laptop,
  PenTool,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "About · SkillTek" };

const PILLARS = [
  { title: "Our Mission", text: "Deliver practical, affordable and modern education." },
  { title: "Our People", text: "Passionate teachers and a supportive community." },
  { title: "Our Promise", text: "Quality learning, measurable results." },
];

type Member = {
  name: string;
  role: string;
  short?: string;
  image?: string;
  icon: LucideIcon;
  responsibilities: string[];
  linkedin?: string;
};

// Leadership & Management Structure. A member without `image` shows their
// role icon until a photo is added to /public/team.
const LEADERS: Member[] = [
  {
    name: "Sarfaraz Ahmed",
    role: "Chief Executive Officer",
    short: "CEO",
    image: "/founders/founder.jpg",
    icon: UserRound,
    responsibilities: [
      "Overall leadership & vision",
      "Strategic planning & growth",
      "Business development",
      "Partnerships & collaborations",
      "Performance & quality oversight",
    ],
    linkedin: "https://www.linkedin.com/in/sarfarazahmed07/",
  },
  {
    name: "Sarwar Ali",
    role: "Chief Technology Officer",
    short: "CTO",
    image: "/founders/Co-Founder.jpeg",
    icon: Laptop,
    responsibilities: [
      "Technology strategy & implementation",
      "IT infrastructure & digital systems",
      "Website, LMS & automation tools",
      "Technical support & innovation",
      "Ensure smooth and secure operations",
    ],
    linkedin: "https://www.linkedin.com/in/sarwar-ali-6991b1277/",
  },
  {
    name: "Ashfaq Ahmed",
    role: "Creative & Design Director",
    image: "/team/ashfaq-ahmed.jpg",
    icon: PenTool,
    responsibilities: [
      "Design & creative production",
      "Branding & visual identity",
      "Marketing & social media creatives",
      "Campaigns, event branding & promotional materials",
      "Maintain a consistent and professional brand presence",
    ],
  },
  {
    name: "Mushtaque Ahmed",
    role: "Chief Operating & Finance Officer",
    short: "COFO",
    image: "/team/mushtaque-ahmed.jpg",
    icon: Coins,
    responsibilities: [
      "Financial management & accounting",
      "Budgeting & cost control",
      "Administrative operations & resource management",
      "Procurement & vendor coordination",
      "Operational planning & compliance",
    ],
  },
];

const MEMBERS: Member[] = [
  { name: "Sajid Ali", role: "Executive Member", icon: UserRound, responsibilities: [] },
];

const VALUES = [
  { icon: Handshake, title: "Teamwork", text: "Work together for shared success" },
  { icon: Award, title: "Professionalism", text: "Maintain high standards in all operations" },
  { icon: TrendingUp, title: "Growth", text: "Expand, innovate, and create opportunities" },
  { icon: UsersRound, title: "Shared Prosperity", text: "Build a sustainable platform for everyone's earning and development" },
];

function Photo({ m, className }: { m: Member; className: string }) {
  const Icon = m.icon;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-brand-600/25 to-slate-900 ${className}`}>
      {m.image ? (
        <Image
          src={m.image}
          alt={m.name}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-16 w-16 text-brand-300/80" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

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
              Leadership &amp; Management
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Meet Our Team</h2>
            <p className="mt-3 leading-relaxed text-slate-400">
              The people behind SkillTek Institute &amp; Media Solutions, working together to build
              practical education that changes lives.
            </p>
          </div>

          {/* ---------- Management team ---------- */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.map((m, i) => (
              <Reveal key={m.name} delay={i * 90} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-brand-500/40">
                  <Photo m={m} className="aspect-[4/5]" />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-white">{m.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-300">
                      {m.role}
                      {m.short && <span className="text-brand-400"> ({m.short})</span>}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-400">
                      Key responsibilities
                    </p>
                    <ul className="mt-2 flex-1 space-y-1.5 text-sm text-slate-400">
                      {m.responsibilities.map((r) => (
                        <li key={r} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                    {m.linkedin && (
                      <a
                        href={m.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 hover:text-brand-200"
                      >
                        LinkedIn <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* ---------- Members ---------- */}
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {MEMBERS.map((m) => (
              <Reveal key={m.name} className="w-full sm:w-auto">
                <article className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 pr-6 transition-colors hover:border-brand-500/40 sm:min-w-[300px]">
                  <Photo m={m} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div>
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    <p className="text-sm text-slate-400">{m.role}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* ---------- Shared goal ---------- */}
          <Reveal className="mt-12">
            <div className="flex flex-col gap-5 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-600/20 via-slate-900/40 to-slate-900/40 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
              <p className="flex shrink-0 items-center gap-2 text-xl font-bold text-white">
                <Target className="h-6 w-6 text-brand-400" /> Our Shared Goal
              </p>
              <p className="leading-relaxed text-slate-300 md:border-l md:border-white/15 md:pl-8">
                To build and manage a professional, sustainable, and profitable institute that
                delivers quality learning, generates growth, and creates earning opportunities for
                all team members.
              </p>
            </div>
          </Reveal>

          {/* ---------- Values ---------- */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 80} className="h-full">
                <div className="flex h-full gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <Icon className="h-6 w-6 shrink-0 text-brand-400" />
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
