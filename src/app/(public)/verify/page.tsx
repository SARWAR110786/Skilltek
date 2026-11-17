import Link from "next/link";
import { headers } from "next/headers";
import { connection } from "next/server";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock,
  Hash,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import {
  findPassoutCertificate,
  isValidRollFormat,
  normalizeRollInput,
  type VerifiedCertificate,
} from "@/lib/certificate";
import { rateLimit } from "@/lib/rate-limit";
import { APP_TIME_ZONE } from "@/lib/utils";

export const metadata = {
  title: "Verify Certificate · SkillTek",
  description:
    "Check that a SkillTek Institute certificate is genuine using the roll number printed on it.",
};

// Reads the query string and live data; allow this segment to block.
export const instant = false;

type Result =
  | { kind: "idle" }
  | { kind: "invalid"; roll: string }
  | { kind: "limited" }
  | { kind: "error"; roll: string }
  | { kind: "notfound"; roll: string }
  | { kind: "verified"; cert: VerifiedCertificate };

async function lookup(rawRoll: string | undefined): Promise<Result> {
  if (rawRoll === undefined || rawRoll.trim() === "") return { kind: "idle" };
  await connection();

  const roll = normalizeRollInput(rawRoll);
  if (!isValidRollFormat(roll)) return { kind: "invalid", roll };

  // Slow down anyone trying to walk through every roll number.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`verify:${ip}`, 20, 10 * 60_000).ok) return { kind: "limited" };

  try {
    const cert = await findPassoutCertificate(roll);
    return cert ? { kind: "verified", cert } : { kind: "notfound", roll };
  } catch (error) {
    console.error("[verify] lookup failed:", error);
    return { kind: "error", roll };
  }
}

function monthYear(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    year: "numeric",
  });
}

const STEPS = [
  {
    icon: Hash,
    title: "Find the roll number",
    text: "It is printed on the certificate, e.g. SK-26-001-05.",
  },
  {
    icon: Search,
    title: "Enter it above",
    text: "Type it exactly as printed. Capital letters are not required.",
  },
  {
    icon: BadgeCheck,
    title: "Match the details",
    text: "The name and course shown must match the certificate.",
  },
];

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ roll?: string }>;
}) {
  const sp = await searchParams;
  const result = await lookup(typeof sp.roll === "string" ? sp.roll : undefined);
  const defaultRoll =
    result.kind === "verified"
      ? result.cert.rollNo
      : "roll" in result
        ? result.roll
        : "";

  return (
    <div>
      <PageHero
        eyebrow="Certificate Verification"
        title="Verify a Certificate"
        subtitle="Employers, universities and students can confirm that a SkillTek Institute certificate is genuine using the roll number printed on it."
      />

      <section className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Enter roll number
                </h2>
                <p className="text-sm text-slate-500">
                  As printed on the certificate
                </p>
              </div>
            </div>

            {/* GET form: works without JavaScript and gives a shareable link
                (e.g. for a QR code printed on the certificate). */}
            <form
              action="/verify"
              method="get"
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="roll" className="sr-only">
                Roll number
              </label>
              <input
                id="roll"
                name="roll"
                defaultValue={defaultRoll}
                required
                maxLength={40}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. SK-26-001-05"
                className="w-full flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-base tracking-wide text-slate-900 uppercase outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                Verify
              </button>
            </form>
          </div>
        </Reveal>

        <div className="mt-8" aria-live="polite">
          {result.kind === "verified" && <VerifiedCard cert={result.cert} />}

          {result.kind === "notfound" && (
            <Notice
              tone="rose"
              title="No certificate found"
              text={
                <>
                  We couldn&apos;t find a completed-course certificate for{" "}
                  <span className="font-mono font-semibold text-white">
                    {result.roll}
                  </span>
                  . Check the roll number and try again. If you believe this is
                  a mistake, please{" "}
                  <Link href="/contact" className="font-medium text-brand-300 underline-offset-4 hover:underline">
                    contact us
                  </Link>
                  .
                </>
              }
            />
          )}

          {result.kind === "invalid" && (
            <Notice
              tone="amber"
              title="That doesn't look like a roll number"
              text="Roll numbers use letters, numbers and dashes, for example SK-26-001-05."
            />
          )}

          {result.kind === "limited" && (
            <Notice
              tone="amber"
              title="Too many searches"
              text="Please wait a few minutes and try again."
            />
          )}

          {result.kind === "error" && (
            <Notice
              tone="amber"
              title="Verification is temporarily unavailable"
              text="Something went wrong on our side. Please try again shortly."
            />
          )}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90} className="h-full">
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-brand-500/40 hover:bg-white/[0.05]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-white">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

function VerifiedCard({ cert }: { cert: VerifiedCertificate }) {
  const rows = [
    { icon: User, label: "Student name", value: cert.name },
    { icon: Hash, label: "Roll number", value: cert.rollNo, mono: true },
    {
      icon: BookOpen,
      label: "Course",
      value: cert.course
        ? `${cert.course}${cert.courseCode ? ` (${cert.courseCode})` : ""}`
        : "—",
    },
    {
      icon: Clock,
      label: "Duration",
      value: cert.durationMonths
        ? `${cert.durationMonths} month${cert.durationMonths === 1 ? "" : "s"}`
        : "—",
    },
    { icon: CalendarDays, label: "Enrolled", value: monthYear(cert.admissionDate) },
    { icon: Award, label: "Status", value: "Course completed (Passout)" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] shadow-2xl">
      <div className="pointer-events-none absolute -top-20 right-0 h-48 w-72 rounded-full bg-emerald-500/20 blur-[90px]" />
      <div className="relative flex flex-col items-start gap-4 border-b border-emerald-400/20 p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Verified
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white">
            Genuine SkillTek certificate
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            This roll number belongs to a student who completed their course at
            SkillTek Institute.
          </p>
        </div>
      </div>
      <dl className="relative grid gap-px bg-white/5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 bg-slate-950/60 p-5">
            <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <dt className="text-xs text-slate-400">{r.label}</dt>
              <dd
                className={
                  r.mono
                    ? "mt-0.5 break-all font-mono font-semibold tracking-wide text-white"
                    : "mt-0.5 font-semibold text-white"
                }
              >
                {r.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="relative px-6 py-4 text-xs text-slate-400 sm:px-8">
        Make sure the name and course above match the printed certificate.
      </p>
    </div>
  );
}

function Notice({
  tone,
  title,
  text,
}: {
  tone: "rose" | "amber";
  title: string;
  text: React.ReactNode;
}) {
  const styles =
    tone === "rose"
      ? "border-rose-400/30 bg-rose-500/[0.06] text-rose-300 ring-rose-400/30"
      : "border-amber-400/30 bg-amber-500/[0.06] text-amber-300 ring-amber-400/30";
  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-6 ${styles}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p>
      </div>
    </div>
  );
}
