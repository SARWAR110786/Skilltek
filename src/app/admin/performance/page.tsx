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
      <Table head={["Rank", "Student", "Quizzes", "Assignments", "Assessments", "Attendance", "Overall"]}>
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
              <Part value={r.assessment} hint={`${r.assessmentCount} test${r.assessmentCount === 1 ? "" : "s"}`} />
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
  const published = live
    ? parsePublished(live.students, { month: live.month, year: live.year })
    : [];
  const liveForCourse = course ? published.find((c) => c.courseId === course) : undefined;
  const courseName = courseList.find((c) => c.id === course)?.title;

  return (
    <div>
      <PageHeader
        title="Student Performance"
        subtitle={`Top 10 students of each course in ${label}, by quizzes, assignments, assessments and attendance`}
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
          Top {PUBLISH_COUNT} students of {courseName ?? "every course"} for {label} are now live
          on the website.
        </Alert>
      )}
      {sp.removed === "1" && <Alert tone="success">
          {courseName ? `${courseName} removed from the website.` : "All courses removed from the website."}
        </Alert>}
      {sp.error === "empty" && (
        <Alert tone="error">There is no quiz, assignment, assessment or attendance data for {label} yet.</Alert>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              {course ? (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    {courseName}:{" "}
                    {liveForCourse ? (
                      <>
                        on the website now ·{" "}
                        <span className="text-brand-700">
                          {MONTHS[liveForCourse.month - 1]} {liveForCourse.year}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">not published</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Publishing here only changes {courseName}. Other courses stay as they are.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    {published.length === 0
                      ? "Nothing is published on the website"
                      : `${published.length} course${published.length === 1 ? "" : "s"} on the website`}
                  </p>
                  {published.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {published.map((c) => (
                        <li key={c.courseId ?? c.courseTitle}>
                          {c.courseTitle} ·{" "}
                          <span className="font-medium text-brand-700">
                            {MONTHS[c.month - 1]} {c.year}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Pick a course to publish it alone, or publish every course at once.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(course ? liveForCourse : published.length > 0) && (
              <form action={unpublishTopStudents}>
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="course" value={course} />
                <Button type="submit" variant="secondary">
                  {course ? "Remove this course from website" : "Remove all from website"}
                </Button>
              </form>
            )}
            <form action={publishTopStudents}>
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="course" value={course} />
              <Button type="submit" disabled={groups.length === 0}>
                <Trophy className="h-4 w-4" />
                {course
                  ? liveForCourse?.month === month && liveForCourse.year === year
                    ? `Update ${label} on website`
                    : `Publish top ${PUBLISH_COUNT} · ${label}`
                  : `Publish top ${PUBLISH_COUNT} of every course · ${label}`}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {groups.length === 0 && (
        <Card>
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No quizzes, graded assignments, assessments or attendance found
            {courseName ? ` for ${courseName}` : ""} in {label}.
          </p>
        </Card>
      )}
      <div className="space-y-6">
        {groups.map((g) => (
          <CourseTable key={g.courseId} title={g.courseTitle} label={label} rows={g.rows} />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p className="mb-1 font-semibold text-slate-700">How the overall score (out of 100) is calculated</p>
        <p>
          Quizzes {WEIGHTS.quiz}% + Assignments {WEIGHTS.assignment}% + Assessments{" "}
          {WEIGHTS.assessment}% + Attendance {WEIGHTS.attendance}%. Each course is ranked separately;
          only active students are ranked.
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>A part that wasn&apos;t held for the course that month is left out and the others count more.</li>
          <li>A skipped quiz, an assignment not submitted, or Absent / Not submitted in an assessment counts as 0.</li>
          <li>A submitted assignment waiting for a grade, or a student left blank on an assessment sheet, is left out.</li>
          <li>A quiz belongs to the month of its first attempt; an assignment to the month of its due date.</li>
          <li>Anything before a student&apos;s admission date is ignored. If the course had any quiz, assignment or assessment that month, a student needs at least one of them to be ranked.</li>
        </ul>
        <p className="mt-1">
          With a course selected, Publish and Remove only change that course. With &quot;All courses&quot;,
          Publish replaces every course with the chosen month.
        </p>
      </div>
    </div>
  );
}
