import { connection } from "next/server";
import { Globe, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Alert, Badge, Button, Card, CardHeader, PageHeader, Table } from "@/components/ui";
import { ReportFilter } from "@/components/report-filter";
import { MONTHS } from "@/lib/challan";
import { cn, dateInputValue, formatDateTime } from "@/lib/utils";
import { financeYears, readMonth, readYear } from "@/lib/finance";
import {
  PUBLISH_COUNT,
  WEIGHTS,
  groupByCourse,
  monthlyPerformance,
  parsePublished,
  type PerformanceRow,
} from "@/lib/performance";
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

function CourseTable({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: PerformanceRow[];
}) {
  const top = rows.slice(0, 10);
  return (
    <Card>
      <CardHeader
        title={`${title} — Top 10`}
        subtitle={`${label} · ${rows.length} student${rows.length === 1 ? "" : "s"} ranked · the first ${PUBLISH_COUNT} are published`}
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
              <p className="text-xs text-slate-400">{r.admissionNo}</p>
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
      </Table>
    </Card>
  );
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    course?: string;
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

  const [rows, live, courseList] = await Promise.all([
    monthlyPerformance(year, month),
    prisma.topStudentsPublication.findUnique({ where: { id: "current" } }),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  const course = courseList.some((c) => c.id === sp.course) ? (sp.course as string) : "";
  const groups = groupByCourse(rows).filter((g) => !course || g.courseId === course);
  const liveLabel = live ? `${MONTHS[live.month - 1]} ${live.year}` : null;
  const liveCourses = live ? parsePublished(live.students).length : 0;
  const isLiveMonth = live?.month === month && live?.year === year;
  const courseName = courseList.find((c) => c.id === course)?.title;

  return (
    <div>
      <PageHeader
        title="Student Performance"
        subtitle={`Top 10 students of each course in ${label}, by quizzes, assignments and attendance`}
        action={
          <ReportFilter
            view="month"
            year={year}
            month={month}
            years={financeYears(year)}
            basePath="/admin/performance"
            showViewToggle={false}
            courses={courseList}
            course={course}
          />
        }
      />

      {sp.published === "1" && (
        <Alert tone="success">
          Top {PUBLISH_COUNT} students of every course for {label} are now live on the website.
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
                    On the website now: <span className="text-brand-700">{liveLabel}</span>{" "}
                    <span className="font-normal text-slate-500">
                      ({liveCourses} course{liveCourses === 1 ? "" : "s"})
                    </span>
                  </>
                ) : (
                  "Nothing is published on the website"
                )}
              </p>
              <p className="text-xs text-slate-500">
                {live
                  ? `Published ${formatDateTime(live.publishedAt)}. Publishing another month replaces it.`
                  : `Publish to show the top ${PUBLISH_COUNT} students of each course on the home page.`}
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
                  : `Publish top ${PUBLISH_COUNT} of every course · ${label}`}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {groups.length === 0 && (
        <Card>
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No quizzes, graded assignments or attendance found
            {courseName ? ` for ${courseName}` : ""} in {label}.
          </p>
        </Card>
      )}
      <div className="space-y-6">
        {groups.map((g) => (
          <CourseTable key={g.courseId} title={g.courseTitle} label={label} rows={g.rows} />
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Overall score (out of 100) = Quizzes {WEIGHTS.quiz}% + Assignments {WEIGHTS.assignment}% +
        Attendance {WEIGHTS.attendance}%. If a part wasn&apos;t held for a course that month it is
        left out and the others count more. A quiz or graded assignment the student missed counts
        as 0. Each course is ranked separately and only active students are ranked. Publishing puts the top 5 of every course on the website.
      </p>
    </div>
  );
}
