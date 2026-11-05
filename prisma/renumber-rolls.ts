import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  courseCodeFromTitle,
  formatRollNo,
  rollYear,
} from "../src/lib/roll-number";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function uniqueCode(title: string, used: Set<string>): string {
  const base = courseCodeFromTitle(title) || "GEN";
  let code = base;
  let suffix = 2;

  while (used.has(code)) {
    code = `${base.slice(0, 4)}${suffix}`;
    suffix += 1;
  }

  used.add(code);
  return code;
}

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
    const code = uniqueCode(course.title, used);
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
