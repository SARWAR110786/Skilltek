import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { formatRollNo, rollYear } from "../src/lib/roll-number";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [courses, students, teachers, attendance, challans, quizAttempts, assignmentSubmissions] =
    await Promise.all([
      prisma.course.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, code: true },
      }),
      prisma.student.findMany({
        orderBy: [{ courseId: "asc" }, { admissionNo: "asc" }],
        select: { id: true, courseId: true, admissionNo: true },
      }),
      prisma.teacher.findMany(),
      prisma.attendance.findMany(),
      prisma.challan.findMany(),
      prisma.quizAttempt.count(),
      prisma.assignmentSubmission.count(),
    ]);

  if (!courses.length || !students.length) {
    throw new Error("Refusing to renumber: no courses or students found.");
  }
  if (students.some((s) => s.admissionNo.startsWith("SK-26-"))) {
    throw new Error("Refusing to renumber: new-format roll numbers already exist.");
  }

  const leftoverCourseTemps = await prisma.course.count({
    where: { code: { startsWith: "__CODE_TMP__" } },
  });
  const leftoverRollTemps = await prisma.student.count({
    where: { admissionNo: { startsWith: "__ROLL_TMP__" } },
  });
  if (leftoverCourseTemps || leftoverRollTemps) {
    throw new Error("Refusing to renumber: temporary values from a previous run remain.");
  }

  const year = rollYear(new Date());
  const codeById = new Map<string, string>();
  const courseChanges: Record<string, { from: string | null; to: string }> = {};
  courses.forEach((course, index) => {
    const to = String(index + 1).padStart(3, "0");
    codeById.set(course.id, to);
    courseChanges[course.id] = { from: course.code, to };
  });

  const counters = new Map<string, number>();
  const studentChanges: Array<{ id: string; from: string; to: string }> = [];
  for (const student of students) {
    const code = student.courseId ? (codeById.get(student.courseId) ?? "GEN") : "GEN";
    const key = `${year}|${code}`;
    const serial = (counters.get(key) ?? 0) + 1;
    counters.set(key, serial);
    studentChanges.push({
      id: student.id,
      from: student.admissionNo,
      to: formatRollNo(year, code, serial),
    });
  }

  if (new Set(studentChanges.map((s) => s.to)).size !== studentChanges.length) {
    throw new Error("Refusing to renumber: generated roll numbers are not unique.");
  }

  const createdAt = new Date().toISOString();
  const backup = {
    createdAt,
    note: "Snapshot before safe course-code and roll-number renumbering",
    counts: {
      courses: courses.length,
      students: students.length,
      teachers: teachers.length,
      attendance: attendance.length,
      challans: challans.length,
      quizAttempts,
      assignmentSubmissions,
    },
    tables: {
      courses,
      students,
      teachers,
      attendance,
      challans,
    },
    oldToNew: {
      courses: courseChanges,
      students: Object.fromEntries(
        studentChanges.map((s) => [s.id, { from: s.from, to: s.to }]),
      ),
    },
  };

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });
  const stamp = createdAt.replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `pre-renumber-${stamp}.json`);
  await writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Backup written to ${backupPath}`);

  const [courseCountNow, studentCountNow, attendanceCountNow, challanCountNow] = await Promise.all([
    prisma.course.count(),
    prisma.student.count(),
    prisma.attendance.count(),
    prisma.challan.count(),
  ]);
  if (
    courseCountNow !== courses.length ||
    studentCountNow !== students.length ||
    attendanceCountNow !== attendance.length ||
    challanCountNow !== challans.length
  ) {
    throw new Error("Refusing to renumber: data changed while preparing. No records were modified.");
  }

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await prisma.$transaction(
    async (tx) => {
      for (const course of courses) {
        await tx.course.update({
          where: { id: course.id },
          data: { code: `__CODE_TMP__${runId}__${course.id}` },
        });
      }
      for (const course of courses) {
        await tx.course.update({
          where: { id: course.id },
          data: { code: codeById.get(course.id)! },
        });
      }

      for (const student of studentChanges) {
        await tx.student.update({
          where: { id: student.id },
          data: { admissionNo: `__ROLL_TMP__${runId}__${student.id}` },
        });
      }
      for (const student of studentChanges) {
        await tx.student.update({
          where: { id: student.id },
          data: { admissionNo: student.to },
        });
      }

      const [afterCourses, afterStudents, courseCount, studentCount, attendanceCount, challanCount] =
        await Promise.all([
          tx.course.findMany({ where: { id: { in: courses.map((c) => c.id) } }, select: { id: true, code: true } }),
          tx.student.findMany({ where: { id: { in: studentChanges.map((s) => s.id) } }, select: { id: true, admissionNo: true } }),
          tx.course.count(),
          tx.student.count(),
          tx.attendance.count(),
          tx.challan.count(),
        ]);

      for (const course of afterCourses) {
        if (course.code !== codeById.get(course.id)) {
          throw new Error(`Course code verification failed for ${course.id}`);
        }
      }
      const finalRolls = new Map(studentChanges.map((s) => [s.id, s.to]));
      for (const student of afterStudents) {
        if (student.admissionNo !== finalRolls.get(student.id)) {
          throw new Error(`Roll-number verification failed for ${student.id}`);
        }
      }
      if (
        courseCount !== backup.counts.courses ||
        studentCount !== backup.counts.students ||
        attendanceCount !== backup.counts.attendance ||
        challanCount !== backup.counts.challans
      ) {
        throw new Error("Record-count verification failed inside transaction.");
      }
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log("Course codes:");
  for (const course of courses) {
    console.log(`  ${course.code} -> ${courseChanges[course.id].to}  (${course.title})`);
  }
  console.log("Student rolls:");
  for (const student of studentChanges) {
    console.log(`  ${student.from} -> ${student.to}`);
  }
  console.log(
    `Done. ${studentChanges.length} student(s) renumbered. Attendance rows: ${backup.counts.attendance}, challans: ${backup.counts.challans} (unchanged).`,
  );
  console.log(`Rollback with: npx tsx prisma/rollback-renumber.ts`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
