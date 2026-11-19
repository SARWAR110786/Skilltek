import { prisma } from "@/lib/prisma";
import { monthKey, monthKeyOf } from "@/lib/finance";
import { dateInputValue } from "@/lib/utils";

/**
 * Monthly student performance (each course ranked separately).
 *
 * Four parts, each scored 0-100 for the month:
 *  - Quizzes:     marks earned / marks possible on the course's quizzes of the
 *                 month. A quiz belongs to the month of its FIRST attempt, so it
 *                 is never split across two months. Skipped quiz = 0.
 *  - Assignments: marks earned / marks possible on the course's assignments of
 *                 the month (month of the due date, or of creation if there is
 *                 none). Only assignments the teacher has started grading count.
 *                 Not submitted = 0; submitted but not graded yet = left out.
 *  - Assessments: offline tests (paper, verbal, practical …) dated in the month
 *                 that have marks entered. Absent / Not submitted = 0; a student
 *                 left blank on the marks sheet is left out.
 *  - Attendance:  days present / days attendance was taken for the course.
 *
 * Everything before the student's admission date is ignored, so a student who
 * joins mid-month is not penalised for earlier days or tests. If the course had
 * any quiz / assignment / assessment that month, a student needs at least one
 * of them counted to be ranked (attendance alone is not enough).
 *
 * Overall = weighted average of the parts that were held for the course that
 * month (weights below). A part that was not held is left out and the other
 * parts' weights grow to fill 100.
 */
export const WEIGHTS = { quiz: 25, assignment: 25, assessment: 30, attendance: 20 } as const;

export type PerformanceRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  avatarUrl: string | null;
  courseId: string;
  courseTitle: string | null;
  quiz: number | null; // % or null when nothing counted that month
  assignment: number | null;
  assessment: number | null;
  attendance: number | null;
  quizCount: number;
  assignmentCount: number;
  assessmentCount: number;
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
  const day = (d: Date) => dateInputValue(d); // YYYY-MM-DD in Pakistan time

  const [students, quizzes, assignments, assessments, attendance] = await Promise.all([
    prisma.student.findMany({
      where: { status: "ACTIVE", exitReason: null, courseId: { not: null } },
      select: {
        id: true,
        admissionNo: true,
        admissionDate: true,
        courseId: true,
        user: { select: { name: true, avatarUrl: true, status: true } },
        course: { select: { title: true } },
      },
    }),
    // Quizzes with an attempt in (or around) the month, with ALL their attempts.
    prisma.quiz.findMany({
      where: { attempts: { some: { submittedAt: window } } },
      select: {
        id: true,
        courseId: true,
        totalMarks: true,
        attempts: { select: { studentId: true, score: true, total: true, submittedAt: true } },
      },
    }),
    prisma.assignment.findMany({
      where: {
        marks: { gt: 0 },
        OR: [{ dueDate: window }, { dueDate: null, createdAt: window }],
      },
      select: {
        id: true,
        courseId: true,
        marks: true,
        dueDate: true,
        createdAt: true,
        submissions: { select: { studentId: true, marksObtained: true } },
      },
    }),
    prisma.assessment.findMany({
      where: { date: window, totalMarks: { gt: 0 } },
      select: {
        id: true,
        courseId: true,
        totalMarks: true,
        date: true,
        marks: { select: { studentId: true, status: true, marks: true } },
      },
    }),
    prisma.attendance.findMany({
      where: { date: window },
      select: { studentId: true, date: true, status: true },
    }),
  ]);

  const courseOf = new Map(students.map((s) => [s.id, s.courseId as string]));

  // ---- Quizzes of the month per course (month of the first attempt) ----
  type QuizHeld = { id: string; day: string; total: number; scores: Map<string, number> };
  const quizByCourse = new Map<string, QuizHeld[]>();
  for (const q of quizzes) {
    if (q.attempts.length === 0) continue;
    const first = q.attempts.reduce((a, b) => (a.submittedAt <= b.submittedAt ? a : b));
    if (!inMonth(first.submittedAt)) continue;
    const total = Math.max(q.totalMarks, ...q.attempts.map((a) => a.total));
    if (total <= 0) continue;
    const list = quizByCourse.get(q.courseId) ?? [];
    list.push({
      id: q.id,
      day: day(first.submittedAt),
      total,
      scores: new Map(q.attempts.map((a) => [a.studentId, a.score])),
    });
    quizByCourse.set(q.courseId, list);
  }

  // ---- Assignments of the month per course (graded ones only) ----
  type AsgHeld = { id: string; day: string; marks: number; subs: Map<string, number | null> };
  const asgByCourse = new Map<string, AsgHeld[]>();
  for (const a of assignments) {
    const when = a.dueDate ?? a.createdAt;
    if (!inMonth(when)) continue;
    if (!a.submissions.some((s) => s.marksObtained != null)) continue; // grading not started
    const list = asgByCourse.get(a.courseId) ?? [];
    list.push({
      id: a.id,
      day: day(when),
      marks: a.marks,
      subs: new Map(a.submissions.map((s) => [s.studentId, s.marksObtained])),
    });
    asgByCourse.set(a.courseId, list);
  }

  // ---- Offline assessments of the month per course (with marks entered) ----
  type AssHeld = {
    id: string;
    day: string;
    total: number;
    marks: Map<string, { status: string; marks: number | null }>;
  };
  const assByCourse = new Map<string, AssHeld[]>();
  for (const a of assessments) {
    if (!inMonth(a.date) || a.marks.length === 0) continue;
    const list = assByCourse.get(a.courseId) ?? [];
    list.push({
      id: a.id,
      day: day(a.date),
      total: a.totalMarks,
      marks: new Map(a.marks.map((m) => [m.studentId, { status: m.status, marks: m.marks }])),
    });
    assByCourse.set(a.courseId, list);
  }

  // ---- Attendance days per course this month ----
  const courseDays = new Map<string, Set<string>>();
  const present = new Map<string, Set<string>>();
  for (const r of attendance) {
    if (!inMonth(r.date)) continue;
    const course = courseOf.get(r.studentId);
    if (!course) continue;
    const d = day(r.date);
    const days = courseDays.get(course) ?? new Set<string>();
    days.add(d);
    courseDays.set(course, days);
    if (r.status === "PRESENT") {
      const p = present.get(r.studentId) ?? new Set<string>();
      p.add(d);
      present.set(r.studentId, p);
    }
  }

  const rows: PerformanceRow[] = [];
  for (const s of students) {
    if (s.user.status !== "ACTIVE") continue;
    const course = s.courseId as string;
    const joined = day(s.admissionDate);

    // Quizzes (skipped = 0)
    let qEarned = 0;
    let qPossible = 0;
    let qCount = 0;
    for (const q of quizByCourse.get(course) ?? []) {
      const score = q.scores.get(s.id);
      if (score === undefined && q.day < joined) continue; // before the student joined
      qPossible += q.total;
      qEarned += Math.max(0, Math.min(q.total, score ?? 0));
      qCount += 1;
    }

    // Assignments (not submitted = 0, waiting for a grade = left out)
    let aEarned = 0;
    let aPossible = 0;
    let aCount = 0;
    for (const a of asgByCourse.get(course) ?? []) {
      const has = a.subs.has(s.id);
      const got = a.subs.get(s.id);
      if (has && got == null) continue; // submitted, not graded yet
      if (!has && a.day < joined) continue;
      aPossible += a.marks;
      aEarned += Math.max(0, Math.min(a.marks, got ?? 0));
      aCount += 1;
    }

    // Assessments (absent / not submitted = 0, blank row = left out)
    let tEarned = 0;
    let tPossible = 0;
    let tCount = 0;
    for (const t of assByCourse.get(course) ?? []) {
      const m = t.marks.get(s.id);
      if (!m) continue;
      tPossible += t.total;
      tEarned += m.status === "MARKED" ? Math.max(0, Math.min(t.total, m.marks ?? 0)) : 0;
      tCount += 1;
    }

    // Attendance (only days since the student joined)
    const days = Array.from(courseDays.get(course) ?? []).filter((d) => d >= joined);
    const mine = present.get(s.id);
    const presentDays = days.filter((d) => mine?.has(d)).length;

    const parts = {
      quiz: pct(qEarned, qPossible),
      assignment: pct(aEarned, aPossible),
      assessment: pct(tEarned, tPossible),
      attendance: pct(presentDays, days.length),
    };

    let weighted = 0;
    let weightSum = 0;
    for (const k of ["quiz", "assignment", "assessment", "attendance"] as const) {
      const v = parts[k];
      if (v == null) continue;
      weighted += v * WEIGHTS[k];
      weightSum += WEIGHTS[k];
    }
    if (weightSum === 0) continue; // nothing counted for this student this month
    // When the course had tests that month, attendance alone isn't enough to be
    // ranked (e.g. someone who joined on the last days of the month).
    const courseHadTests =
      (quizByCourse.get(course)?.length ?? 0) +
        (asgByCourse.get(course)?.length ?? 0) +
        (assByCourse.get(course)?.length ?? 0) >
      0;
    if (courseHadTests && qCount + aCount + tCount === 0) continue;

    rows.push({
      studentId: s.id,
      name: s.user.name,
      admissionNo: s.admissionNo,
      avatarUrl: s.user.avatarUrl,
      courseId: course,
      courseTitle: s.course?.title ?? null,
      ...parts,
      quizCount: qCount,
      assignmentCount: aCount,
      assessmentCount: tCount,
      attendanceDays: days.length,
      overall: Math.round((weighted / weightSum) * 10) / 10,
    });
  }

  // Best overall first; ties go to more activity counted, then alphabetical.
  const activity = (r: PerformanceRow) =>
    r.quizCount + r.assignmentCount + r.assessmentCount + r.attendanceDays;
  rows.sort(
    (a, b) => b.overall - a.overall || activity(b) - activity(a) || a.name.localeCompare(b.name),
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
  assessment: number | null;
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
      assessment: v.assessment == null ? null : Number(v.assessment),
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
