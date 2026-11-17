import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type Backup = {
  createdAt: string;
  counts: {
    courses: number;
    students: number;
    attendance: number;
    challans: number;
  };
  oldToNew: {
    courses: Record<string, { from: string | null; to: string }>;
    students: Record<string, { from: string; to: string }>;
  };
};

async function latestBackupPath(): Promise<string> {
  const dir = path.join(process.cwd(), "backups");
  const files = await readdir(dir);
  const matches = files
    .filter((file) => file.startsWith("pre-renumber-") && file.endsWith(".json"))
    .sort();
  const latest = matches.at(-1);
  if (!latest) throw new Error("No pre-renumber backup found in backups/");
  return path.join(dir, latest);
}

async function main() {
  const backupPath = await latestBackupPath();
  const backup = JSON.parse(await readFile(backupPath, "utf8")) as Backup;
  console.log(`Using backup ${backupPath}`);

  const courseChanges = Object.entries(backup.oldToNew.courses).map(([id, change]) => ({
    id,
    from: change.from,
    to: change.to,
  }));
  const studentChanges = Object.entries(backup.oldToNew.students).map(([id, change]) => ({
    id,
    from: change.from,
    to: change.to,
  }));

  const [courses, students, attendanceCount, challanCount] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseChanges.map((c) => c.id) } }, select: { id: true, code: true } }),
    prisma.student.findMany({ where: { id: { in: studentChanges.map((s) => s.id) } }, select: { id: true, admissionNo: true } }),
    prisma.attendance.count(),
    prisma.challan.count(),
  ]);

  if (courses.length !== courseChanges.length || students.length !== studentChanges.length) {
    throw new Error("Backup does not match current record counts. Refusing to roll back.");
  }

  const expectedCourseCodes = new Map(courseChanges.map((c) => [c.id, c.to]));
  const expectedRolls = new Map(studentChanges.map((s) => [s.id, s.to]));
  for (const course of courses) {
    if (course.code !== expectedCourseCodes.get(course.id)) {
      throw new Error(`Course ${course.id} no longer has the renumbered code. Refusing to roll back.`);
    }
  }
  for (const student of students) {
    if (student.admissionNo !== expectedRolls.get(student.id)) {
      throw new Error(`Student ${student.id} no longer has the renumbered roll. Refusing to roll back.`);
    }
  }
  if (attendanceCount !== backup.counts.attendance || challanCount !== backup.counts.challans) {
    throw new Error("Attendance/challan counts changed. Refusing to roll back automatically.");
  }

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await prisma.$transaction(
    async (tx) => {
      for (const change of courseChanges) {
        await tx.course.update({
          where: { id: change.id },
          data: { code: `__CODE_TMP__${runId}__${change.id}` },
        });
      }
      for (const change of courseChanges) {
        await tx.course.update({
          where: { id: change.id },
          data: { code: change.from },
        });
      }

      for (const change of studentChanges) {
        await tx.student.update({
          where: { id: change.id },
          data: { admissionNo: `__ROLL_TMP__${runId}__${change.id}` },
        });
      }
      for (const change of studentChanges) {
        await tx.student.update({
          where: { id: change.id },
          data: { admissionNo: change.from },
        });
      }

      const [afterCourses, afterStudents, afterAttendance, afterChallans] = await Promise.all([
        tx.course.findMany({ where: { id: { in: courseChanges.map((c) => c.id) } }, select: { id: true, code: true } }),
        tx.student.findMany({ where: { id: { in: studentChanges.map((s) => s.id) } }, select: { id: true, admissionNo: true } }),
        tx.attendance.count(),
        tx.challan.count(),
      ]);

      const restoredCourseCodes = new Map(courseChanges.map((c) => [c.id, c.from]));
      const restoredRolls = new Map(studentChanges.map((s) => [s.id, s.from]));
      for (const course of afterCourses) {
        if (course.code !== restoredCourseCodes.get(course.id)) {
          throw new Error(`Course rollback verification failed for ${course.id}`);
        }
      }
      for (const student of afterStudents) {
        if (student.admissionNo !== restoredRolls.get(student.id)) {
          throw new Error(`Roll rollback verification failed for ${student.id}`);
        }
      }
      if (afterAttendance !== backup.counts.attendance || afterChallans !== backup.counts.challans) {
        throw new Error("Attendance/challan verification failed during rollback.");
      }
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.log(`Rolled back ${courseChanges.length} course code(s) and ${studentChanges.length} student roll(s).`);
  console.log("Attendance and challans were not modified.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
