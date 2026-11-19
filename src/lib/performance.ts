import { prisma } from "@/lib/prisma";
import { monthKey, monthKeyOf } from "@/lib/finance";
import { dateInputValue } from "@/lib/utils";

/**
 * Monthly student performance.
 *
 * For each active student, three parts are scored 0-100 for the month:
 *  - Quizzes:     marks earned / marks possible on every quiz of the student's
 *                 course that was taken that month (a quiz a classmate took but
 *                 this student skipped counts as 0).
 *  - Assignments: marks earned / marks possible on every graded assignment of
 *                 the course that month (missing = 0; submitted but not yet
 *                 graded is left out so it doesn't count against the student).
 *  - Attendance:  days present / days attendance was taken for the course.
 *
 * Overall = weighted average of the parts that were held for the course that
 * month (weights below), so a month without quizzes doesn't pull anyone down.
 */
export const WEIGHTS = { quiz: 40, assignment: 30, attendance: 30 } as const;

export type PerformanceRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  avatarUrl: string | null;
  courseTitle: string | null;
  quiz: number | null; // % or null when no quiz that month
  assignment: number | null;
  attendance: number | null;
  quizCount: number;
  assignmentCount: number;
  attendanceDays: number;
  overall: number;
};

const pct = (earned: number, possible: number) =>
  possible > 0 ? Math.round((earned / possible) * 1000) / 10 : null;

export async function monthlyPerformance(year: number, month: number): Promise<PerformanceRow[]> {
  const key = monthKey(year, month);
  // Wide window (+/- 1 day) then filter exactly by Pakistan calendar month.
  const window = {
    gte: new Date(Date.UTC(year, month - 1, 1) - 86400000),
    lt: new Date(Date.UTC(year, month, 1) + 86400000),
  };
  const inMonth = (d: Date) => monthKeyOf(d) === key;

  const [students, attempts, submissions, attendance] = await Promise.all([
    prisma.student.findMany({
      where: { status: "ACTIVE", exitReason: null, courseId: { not: null } },
      select: {
        id: true,
        admissionNo: true,
        courseId: true,
        user: { select: { name: true, avatarUrl: true, status: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { submittedAt: window },
      select: {
        studentId: true,
        score: true,
        total: true,
        submittedAt: true,
        quiz: { select: { id: true, courseId: true, totalMarks: true } },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: { submittedAt: window },
      select: {
        studentId: true,
        marksObtained: true,
        submittedAt: true,
        assignment: { select: { id: true, courseId: true, marks: true } },
      },
    }),
    prisma.attendance.findMany({
      where: { date: window },
      select: { studentId: true, date: true, status: true },
    }),
  ]);

  const courseOf = new Map(students.map((s) => [s.id, s.courseId as string]));

  // ---- Quizzes held per course this month, and each student's score ----
  const quizTotals = new Map<string, Map<string, number>>(); // course -> quiz -> total
  const quizScore = new Map<string, Map<string, number>>(); // student -> quiz -> score
  for (const a of attempts) {
    if (!inMonth(a.submittedAt)) continue;
    const total = a.total > 0 ? a.total : a.quiz.totalMarks;
    if (total <= 0) continue;
    const course = a.quiz.courseId;
    const qs = quizTotals.get(course) ?? new Map<string, number>();
    qs.set(a.quiz.id, Math.max(qs.get(a.quiz.id) ?? 0, total));
    quizTotals.set(course, qs);
    const mine = quizScore.get(a.studentId) ?? new Map<string, number>();
    mine.set(a.quiz.id, a.score);
    quizScore.set(a.studentId, mine);
  }

  // ---- Graded assignments per course this month ----
  const asgMarks = new Map<string, Map<string, number>>(); // course -> assignment -> marks
  const asgScore = new Map<string, Map<string, number | null>>(); // student -> assignment -> obtained
  for (const s of submissions) {
    if (!inMonth(s.submittedAt) || s.assignment.marks <= 0) continue;
    const mine = asgScore.get(s.studentId) ?? new Map<string, number | null>();
    mine.set(s.assignment.id, s.marksObtained);
    asgScore.set(s.studentId, mine);
    if (s.marksObtained == null) continue;
    const course = s.assignment.courseId;
    const m = asgMarks.get(course) ?? new Map<string, number>();
    m.set(s.assignment.id, s.assignment.marks);
    asgMarks.set(course, m);
  }

  // ---- Attendance days per course this month ----
  const courseDays = new Map<string, Set<string>>();
  const present = new Map<string, Set<string>>();
  for (const r of attendance) {
    if (!inMonth(r.date)) continue;
    const course = courseOf.get(r.studentId);
    if (!course) continue;
    const day = dateInputValue(r.date);
    const days = courseDays.get(course) ?? new Set<string>();
    days.add(day);
    courseDays.set(course, days);
    if (r.status === "PRESENT") {
      const p = present.get(r.studentId) ?? new Set<string>();
      p.add(day);
      present.set(r.studentId, p);
    }
  }

  const rows: PerformanceRow[] = [];
  for (const s of students) {
    if (s.user.status !== "ACTIVE") continue;
    const course = s.courseId as string;

    // Quizzes
    let qEarned = 0;
    let qPossible = 0;
    const quizzes = quizTotals.get(course);
    if (quizzes) {
      const mine = quizScore.get(s.id);
      for (const [quizId, total] of quizzes) {
        qPossible += total;
        qEarned += Math.min(total, mine?.get(quizId) ?? 0);
      }
    }

    // Assignments
    let aEarned = 0;
    let aPossible = 0;
    let aCount = 0;
    const asgs = asgMarks.get(course);
    if (asgs) {
      const mine = asgScore.get(s.id);
      for (const [asgId, marks] of asgs) {
        const got = mine?.get(asgId);
        if (got === null) continue; // submitted, waiting for a grade
        aPossible += marks;
        aEarned += Math.min(marks, got ?? 0);
        aCount += 1;
      }
    }

    // Attendance
    const days = courseDays.get(course)?.size ?? 0;
    const presentDays = present.get(s.id)?.size ?? 0;

    const quiz = pct(qEarned, qPossible);
    const assignment = pct(aEarned, aPossible);
    const att = pct(presentDays, days);

    let weighted = 0;
    let weightSum = 0;
    if (quiz != null) {
      weighted += quiz * WEIGHTS.quiz;
      weightSum += WEIGHTS.quiz;
    }
    if (assignment != null) {
      weighted += assignment * WEIGHTS.assignment;
      weightSum += WEIGHTS.assignment;
    }
    if (att != null) {
      weighted += att * WEIGHTS.attendance;
      weightSum += WEIGHTS.attendance;
    }
    if (weightSum === 0) continue; // nothing happened for this course this month

    rows.push({
      studentId: s.id,
      name: s.user.name,
      admissionNo: s.admissionNo,
      avatarUrl: s.user.avatarUrl,
      courseTitle: s.course?.title ?? null,
      quiz,
      assignment,
      attendance: att,
      quizCount: quizzes?.size ?? 0,
      assignmentCount: aCount,
      attendanceDays: days,
      overall: Math.round((weighted / weightSum) * 10) / 10,
    });
  }

  // Best overall first; ties go to more activity, then alphabetical.
  rows.sort(
    (a, b) =>
      b.overall - a.overall ||
      b.quizCount + b.assignmentCount + b.attendanceDays -
        (a.quizCount + a.assignmentCount + a.attendanceDays) ||
      a.name.localeCompare(b.name),
  );
  return rows;
}

/** What is stored when the top students are published to the website. */
export type PublishedStudent = {
  rank: number;
  name: string;
  courseTitle: string | null;
  avatarUrl: string | null;
  overall: number;
  quiz: number | null;
  assignment: number | null;
  attendance: number | null;
};

export const PUBLISH_COUNT = 5;

export function parsePublished(value: unknown): PublishedStudent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v, i) => ({
      rank: Number(v.rank) || i + 1,
      name: String(v.name ?? ""),
      courseTitle: v.courseTitle ? String(v.courseTitle) : null,
      avatarUrl: v.avatarUrl ? String(v.avatarUrl) : null,
      overall: Number(v.overall) || 0,
      quiz: v.quiz == null ? null : Number(v.quiz),
      assignment: v.assignment == null ? null : Number(v.assignment),
      attendance: v.attendance == null ? null : Number(v.attendance),
    }))
    .filter((s) => s.name)
    .slice(0, PUBLISH_COUNT);
}
