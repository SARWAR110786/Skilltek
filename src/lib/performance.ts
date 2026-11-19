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
  courseId: string;
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
      courseId: course,
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

/** Ranked rows split per course (each list keeps the overall ranking order). */
export function groupByCourse(rows: PerformanceRow[]) {
  const map = new Map<string, { courseId: string; courseTitle: string; rows: PerformanceRow[] }>();
  for (const r of rows) {
    const g = map.get(r.courseId) ?? {
      courseId: r.courseId,
      courseTitle: r.courseTitle ?? "Course",
      rows: [],
    };
    g.rows.push(r);
    map.set(r.courseId, g);
  }
  return Array.from(map.values()).sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}

/** What is stored when the top students are published to the website. */
export type PublishedStudent = {
  /** Kept so the student portal can recognise the student; never sent to the public page. */
  studentId?: string;
  rank: number;
  name: string;
  courseTitle: string | null;
  avatarUrl: string | null;
  overall: number;
  quiz: number | null;
  assignment: number | null;
  attendance: number | null;
};

export type PublishedCourse = {
  courseId?: string;
  courseTitle: string;
  /** Month/year this course's list belongs to (each course is published on its own). */
  month: number;
  year: number;
  publishedAt?: string;
  students: PublishedStudent[];
};

export const PUBLISH_COUNT = 5;

function parseStudents(value: unknown): PublishedStudent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v, i) => ({
      studentId: v.studentId ? String(v.studentId) : undefined,
      rank: Number(v.rank) || i + 1,
      name: String(v.name ?? ""),
      courseTitle: v.courseTitle ? String(v.courseTitle) : null,
      avatarUrl: v.avatarUrl ? String(v.avatarUrl) : null,
      overall: Number(v.overall) || 0,
      quiz: v.quiz == null ? null : Number(v.quiz),
      assignment: v.assignment == null ? null : Number(v.assignment),
      attendance: v.attendance == null ? null : Number(v.attendance),
    }))
    .filter((s) => s.name);
}

/**
 * Published data is { courses: [{ courseId, courseTitle, month, year, students }] }.
 * Older shapes (no month per course, or a flat list of students) are still
 * understood; `fallback` is the row's own month/year.
 */
export function parsePublished(
  value: unknown,
  fallback: { month: number; year: number },
): PublishedCourse[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const courses = (value as { courses?: unknown }).courses;
    if (Array.isArray(courses)) {
      return courses
        .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
        .map((c) => ({
          courseId: c.courseId ? String(c.courseId) : undefined,
          courseTitle: String(c.courseTitle ?? "Course"),
          month: Number(c.month) || fallback.month,
          year: Number(c.year) || fallback.year,
          publishedAt: c.publishedAt ? String(c.publishedAt) : undefined,
          students: parseStudents(c.students).slice(0, PUBLISH_COUNT),
        }))
        .filter((c) => c.students.length > 0);
    }
  }
  const flat = parseStudents(value);
  const map = new Map<string, PublishedStudent[]>();
  for (const st of flat) {
    const key = st.courseTitle ?? "Course";
    map.set(key, [...(map.get(key) ?? []), st]);
  }
  return Array.from(map.entries()).map(([courseTitle, students]) => ({
    courseTitle,
    month: fallback.month,
    year: fallback.year,
    students: students.slice(0, PUBLISH_COUNT).map((st, i) => ({ ...st, rank: i + 1 })),
  }));
}
