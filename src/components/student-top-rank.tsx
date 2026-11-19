import { Award, Crown, Globe, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MONTHS } from "@/lib/challan";
import { cn } from "@/lib/utils";
import { parsePublished } from "@/lib/performance";

/**
 * Student dashboard card for the published "Top Performers" of the month.
 * Shows a congratulations banner when the student is in their course's top 5,
 * plus the top 5 of their course. Hidden when nothing is published for it.
 */
export async function StudentTopRank({
  studentId,
  studentName,
  courseId,
  courseTitle,
}: {
  studentId: string;
  studentName: string;
  courseId: string | null;
  courseTitle: string | null;
}) {
  if (!courseId) return null;
  const live = await prisma.topStudentsPublication.findUnique({ where: { id: "current" } });
  if (!live) return null;

  const courses = parsePublished(live.students);
  const mine =
    courses.find((c) => c.courseId === courseId) ??
    (courseTitle ? courses.find((c) => !c.courseId && c.courseTitle === courseTitle) : undefined);
  if (!mine || mine.students.length === 0) return null;

  // Older publications have no ids; fall back to the name within the course.
  const me = mine.students.find((s) =>
    s.studentId ? s.studentId === studentId : s.name === studentName,
  );
  const period = `${MONTHS[live.month - 1] ?? ""} ${live.year}`;

  return (
    <div className="mb-6 space-y-4">
      {me && (
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-6 shadow-sm",
            me.rank === 1
              ? "border-amber-300 bg-gradient-to-r from-amber-100 via-amber-50 to-white"
              : "border-brand-200 bg-gradient-to-r from-brand-50 via-white to-white",
          )}
        >
          <div className="flex flex-wrap items-center gap-5">
            <span
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                me.rank === 1 ? "bg-amber-400 text-amber-950" : "bg-brand-600 text-white",
              )}
            >
              {me.rank === 1 ? <Crown className="h-7 w-7" /> : <Trophy className="h-7 w-7" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Top Performers · {period}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {me.rank === 1
                  ? `Congratulations! You are the #1 Student of the Month`
                  : `Congratulations! You are #${me.rank} in your course`}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {mine.courseTitle} · Overall score{" "}
                <span className="font-semibold text-slate-900">{me.overall} / 100</span>
                {me.quiz != null && <> · Quizzes {me.quiz}%</>}
                {me.assignment != null && <> · Assignments {me.assignment}%</>}
                {me.attendance != null && <> · Attendance {me.attendance}%</>}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
                <Globe className="h-3.5 w-3.5" /> Your name is shown on the SkillTek website.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-800">Top 5 of your course</h3>
            <p className="text-sm text-slate-500">
              {mine.courseTitle} · {period}
            </p>
          </div>
          <Award className="h-5 w-5 text-amber-500" />
        </div>
        <ol className="divide-y divide-slate-100">
          {mine.students.map((s) => {
            const isMe = me && s.rank === me.rank && s.name === me.name;
            return (
              <li
                key={`${s.rank}-${s.name}`}
                className={cn("flex items-center gap-4 px-5 py-3", isMe && "bg-brand-50/70")}
              >
                <span
                  className={cn(
                    "w-8 text-sm font-bold",
                    s.rank === 1 ? "text-amber-600" : "text-slate-400",
                  )}
                >
                  #{s.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                  {s.name}
                  {isMe && <span className="ml-2 text-xs font-semibold text-brand-600">(You)</span>}
                </span>
                <span className="font-semibold text-slate-900">{s.overall}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
