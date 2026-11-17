import Link from "next/link";
import { headers } from "next/headers";
import { connection } from "next/server";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import {
  findStudentByRoll,
  isValidRollFormat,
  normalizeRollInput,
  type VerifiedStudent,
  type VerifyStatus,
} from "@/lib/certificate";
import { rateLimit } from "@/lib/rate-limit";

export const metadata = {
  title: "Verify Status · SkillTek",
  description:
    "Check a SkillTek Institute student's status using their roll number.",
};

// Reads the query string and live data; allow this segment to block.
export const instant = false;

type Result =
  | { kind: "idle" }
  | { kind: "invalid"; roll: string }
  | { kind: "limited" }
  | { kind: "error"; roll: string }
  | { kind: "notfound"; roll: string }
  | { kind: "found"; student: VerifiedStudent };

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
    const student = await findStudentByRoll(roll);
    return student ? { kind: "found", student } : { kind: "notfound", roll };
  } catch (error) {
    console.error("[verify] lookup failed:", error);
    return { kind: "error", roll };
  }
}

const STATUS_UI: Record<
  VerifyStatus,
  { label: string; note: string; card: string; pill: string }
> = {
  PASSOUT: {
    label: "Passout",
    note: "Course completed. A completion certificate with this roll number is genuine.",
    card: "border-emerald-400/30 bg-emerald-500/[0.06]",
    pill: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  },
  ACTIVE: {
    label: "Active",
    note: "Currently studying. No completion certificate has been issued yet.",
    card: "border-brand-400/30 bg-brand-500/[0.07]",
    pill: "border-brand-400/40 bg-brand-500/15 text-brand-300",
  },
  INACTIVE: {
    label: "Inactive",
    note: "Enrolled but temporarily on hold. No completion certificate has been issued yet.",
    card: "border-amber-400/30 bg-amber-500/[0.06]",
    pill: "border-amber-400/40 bg-amber-500/15 text-amber-300",
  },
  DROPOUT: {
    label: "Dropout",
    note: "Left before completing the course. Any completion certificate with this roll number is not valid.",
    card: "border-rose-400/30 bg-rose-500/[0.06]",
    pill: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ roll?: string }>;
}) {
  const sp = await searchParams;
  const result = await lookup(typeof sp.roll === "string" ? sp.roll : undefined);
  const defaultRoll =
    result.kind === "found"
      ? result.student.rollNo
      : "roll" in result
        ? result.roll
        : "";

  return (
    <div>
      <PageHero
        eyebrow="Verification"
        title="Verify Status"
        subtitle="Enter a SkillTek Institute roll number to check the student's status."
      />

      <section className="mx-auto max-w-2xl px-4 py-16 lg:py-20">
        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
            {/* GET form: works without JavaScript and gives a shareable link
                (e.g. for a QR code printed on the certificate). */}
            <form action="/verify" method="get" className="flex flex-col gap-3 sm:flex-row">
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
                placeholder="Enter your roll number"
                className="w-full flex-1 rounded-lg border border-white/15 bg-slate-950/60 px-4 py-3 font-mono text-base tracking-wide text-white uppercase outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98]"
              >
                Verify
              </button>
            </form>
          </div>
        </Reveal>

        <div className="mt-8" aria-live="polite">
          {result.kind === "found" && <StatusCard student={result.student} />}

          {result.kind === "notfound" && (
            <Notice tone="rose" title="No student found">
              No SkillTek student has the roll number{" "}
              <span className="font-mono font-semibold text-white">{result.roll}</span>.
              Check it and try again, or{" "}
              <Link
                href="/contact"
                className="font-medium text-brand-300 underline-offset-4 hover:underline"
              >
                contact us
              </Link>
              .
            </Notice>
          )}

          {result.kind === "invalid" && (
            <Notice tone="amber" title="Invalid roll number">
              Roll numbers use letters, numbers and dashes, for example SK-26-001-05.
            </Notice>
          )}

          {result.kind === "limited" && (
            <Notice tone="amber" title="Too many searches">
              Please wait a few minutes and try again.
            </Notice>
          )}

          {result.kind === "error" && (
            <Notice tone="amber" title="Verification is temporarily unavailable">
              Something went wrong on our side. Please try again shortly.
            </Notice>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusCard({ student }: { student: VerifiedStudent }) {
  const ui = STATUS_UI[student.status];
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 ${ui.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Student status
        </p>
        <span className={`rounded-full border px-4 py-1 text-sm font-semibold ${ui.pill}`}>
          {ui.label}
        </span>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-white">{student.name}</h3>
      <p className="mt-1 font-mono text-sm tracking-wide text-slate-300">
        {student.rollNo}
      </p>
      {student.course && (
        <p className="mt-1 text-sm text-slate-400">
          {student.course}
          {student.courseCode ? ` (${student.courseCode})` : ""}
        </p>
      )}

      <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-300">
        {ui.note}
      </p>
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "rose" | "amber";
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === "rose"
      ? "border-rose-400/30 bg-rose-500/[0.06]"
      : "border-amber-400/30 bg-amber-500/[0.06]";
  return (
    <div className={`rounded-2xl border p-6 ${styles}`}>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  );
}
