// DO NOT RUN on live data. Use `npm run db:renumber` instead; it creates a
// backup, runs in one transaction, verifies counts, and supports rollback.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { formatRollNo, rollYear } from "../src/lib/roll-number";
import { nextNumericCourseCode } from "../src/lib/course-code";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, code: true },
    orderBy: { createdAt: "asc" },
  });
  const used = new Set(
    courses.map((course) => course.code).filter(Boolean) as string[],
  );

  for (const course of courses) {
    if (course.code) continue;
    const code = nextNumericCourseCode([...used]);
    used.add(code);
    await prisma.course.update({
      where: { id: course.id },
      data: { code },
    });
    console.log(`Course "${course.title}" -> code ${code}`);
  }

  const refreshed = await prisma.course.findMany({
    select: { id: true, code: true },
  });
  const codeById = new Map(
    refreshed.map((course) => [course.id, course.code ?? "GEN"]),
  );

  const students = await prisma.student.findMany({
    orderBy: [{ courseId: "asc" }, { admissionDate: "asc" }, { id: "asc" }],
    select: {
      id: true,
      courseId: true,
      admissionDate: true,
      admissionNo: true,
    },
  });

  for (const student of students) {
    await prisma.student.update({
      where: { id: student.id },
      data: { admissionNo: `TMP-${student.id}` },
    });
  }

  const counters = new Map<string, number>();

  for (const student of students) {
    const code = student.courseId
      ? (codeById.get(student.courseId) ?? "GEN")
      : "GEN";
    const year = rollYear(student.admissionDate);
    const key = `${code}|${year}`;
    const serial = (counters.get(key) ?? 0) + 1;
    counters.set(key, serial);

    const rollNo = formatRollNo(year, code, serial);
    await prisma.student.update({
      where: { id: student.id },
      data: { admissionNo: rollNo },
    });
    console.log(`Roll ${student.admissionNo} -> ${rollNo}`);
  }

  console.log(`Done. ${students.length} student(s) renumbered.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
