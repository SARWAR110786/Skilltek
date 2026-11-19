import { connection } from "next/server";
import { Globe, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Alert, Badge, Button, Card, CardHeader, PageHeader, Table } from "@/components/ui";
import { ReportFilter } from "@/components/report-filter";
import { MONTHS } from "@/lib/challan";
import { cn, dateInputValue, formatDateTime } from "@/lib/utils";
import { financeYears, readMonth, readYear } from "@/lib/finance";
import { PUBLISH_COUNT, WEIGHTS, monthlyPerformance } from "@/lib/performance";
import { publishTopStudents, unpublishTopStudents } from "./actions";

const MEDAL = ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-800", "bg-orange-300 text-orange-950"];

function Part({ value, hint }: { value: number | null; hint: string }) {
  if (value == null) return <span className="text-xs text-slate-300">—</span>;
  return (
    <div>
      <span className="font-medium text-slate-700">{value}%</span>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    published?: string;
    removed?: string;
    error?: string;
  }>;
}) {
  await connection();
  const sp = await searchParams;
  const today = dateInputValue();
  const year = readYear(sp.year);
  const month = readMonth(sp.month) ?? Number(today.slice(5, 7));
  const label = `${MONTHS[month - 1]} ${year}`;

  const [rows, live] = await Promise.all([
    monthlyPerformance(year, month),
    prisma.topStudentsPublication.findUnique({ where: { id: "current" } }),
  ]);
  const top = rows.slice(0, 10);
  const liveLabel = live ? `${MONTHS[live.month - 1]} ${live.year}` : null;
  const isLiveMonth = live?.month === month && live?.year === year;

  return (
    <div>
      <PageHeader
        title="Student Performance"
        subtitle={`Top 10 students of ${label} by quizzes, assignments and attendance`}
        action={
          <ReportFilter
            view="month"
            year={year}
            month={month}
            years={financeYears(year)}
            basePath="/admin/performance"
            showViewToggle={false}
          />
        }
      />

      {sp.published === "1" && (
        <Alert tone="success">
          Top {PUBLISH_COUNT} students of {label} are now live on the website.
        </Alert>
      )}
      {sp.removed === "1" && <Alert tone="success">Top students removed from the website.</Alert>}
      {sp.error === "empty" && (
        <Alert tone="error">There is no quiz, assignment or attendance data for {label} yet.</Alert>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {liveLabel ? (
                  <>
                    On the website now: <span className="text-brand-700">{liveLabel}</span>
                  </>
                ) : (
                  "Nothing is published on the website"
                )}
              </p>
              <p className="text-xs text-slate-500">
                {live
                  ? `Published ${formatDateTime(live.publishedAt)}. Publishing another month replaces it.`
                  : `Publish to show the top ${PUBLISH_COUNT} students on the home page.`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {live && (
              <form action={unpublishTopStudents}>
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="month" value={month} />
                <Button type="submit" variant="secondary">
                  Remove from website
                </Button>
              </form>
            )}
            <form action={publishTopStudents}>
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <Button type="submit" disabled={rows.length === 0}>
                <Trophy className="h-4 w-4" />
                {isLiveMonth
                  ? `Update ${label} on website`
                  : `Publish top ${PUBLISH_COUNT} of ${label}`}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={`Top 10 — ${label}`}
          subtitle={`${rows.length} student${rows.length === 1 ? "" : "s"} ranked · the first ${PUBLISH_COUNT} are published`}
        />
        <Table head={["Rank", "Student", "Quizzes", "Assignments", "Attendance", "Overall"]}>
          {top.map((r, i) => (
            <tr key={r.studentId} className={cn("hover:bg-slate-50", i === 0 && "bg-amber-50/60")}>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    MEDAL[i] ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800">
                  {r.name}
                  {i < PUBLISH_COUNT && (
                    <span className="ml-2 align-middle">
                      <Badge tone="brand">Website</Badge>
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {r.admissionNo}
                  {r.courseTitle ? ` · ${r.courseTitle}` : ""}
                </p>
              </td>
              <td className="px-4 py-3">
                <Part value={r.quiz} hint={`${r.quizCount} quiz${r.quizCount === 1 ? "" : "zes"}`} />
              </td>
              <td className="px-4 py-3">
                <Part value={r.assignment} hint={`${r.assignmentCount} graded`} />
              </td>
              <td className="px-4 py-3">
                <Part value={r.attendance} hint={`${r.attendanceDays} days`} />
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-[120px] items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: `${Math.min(100, r.overall)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-900">{r.overall}</span>
                </div>
              </td>
            </tr>
          ))}
          {top.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                No quizzes, graded assignments or attendance found for {label}.
              </td>
            </tr>
          )}
        </Table>
      </Card>

      <p className="mt-3 text-xs text-slate-400">
        Overall score (out of 100) = Quizzes {WEIGHTS.quiz}% + Assignments {WEIGHTS.assignment}% +
        Attendance {WEIGHTS.attendance}%. If a part wasn&apos;t held for a course that month it is
        left out and the others count more. A quiz or graded assignment the student missed counts
        as 0. Only active students are ranked.
      </p>
    </div>
  );
}
