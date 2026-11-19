"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDateInput } from "@/lib/utils";
import { ASSESSMENT_TYPES, assessmentsPath, manageableCourses } from "@/lib/assessments";

const MAX_TOTAL = 10_000;

async function requireManager() {
  const user = await getSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) redirect("/login");
  const courses = (await manageableCourses(user)) ?? [];
  return { user, base: assessmentsPath(user.role), courseIds: new Set(courses.map((c) => c.id)) };
}

/** Loads an assessment the current user may manage, or sends them back to the list. */
async function ownedAssessment(id: string) {
  const ctx = await requireManager();
  const assessment = id
    ? await prisma.assessment.findUnique({ where: { id }, select: { id: true, courseId: true, totalMarks: true } })
    : null;
  if (!assessment || !ctx.courseIds.has(assessment.courseId)) redirect(`${ctx.base}?error=notfound`);
  return { ...ctx, assessment };
}

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 150);
  const rawType = String(formData.get("type") ?? "");
  const type = (ASSESSMENT_TYPES as readonly string[]).includes(rawType) ? rawType : "";
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const totalMarks = Math.round(Number(formData.get("totalMarks") ?? 0) * 100) / 100;
  const date = String(formData.get("date") ?? "");
  const valid =
    !!title &&
    !!type &&
    Number.isFinite(totalMarks) &&
    totalMarks > 0 &&
    totalMarks <= MAX_TOTAL &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);
  return { title, type, description, totalMarks, date, valid };
}

export async function createAssessment(formData: FormData) {
  const { user, base, courseIds } = await requireManager();
  const courseId = String(formData.get("courseId") ?? "");
  const f = readFields(formData);
  if (!f.valid || !courseIds.has(courseId)) redirect(`${base}?error=required`);

  const created = await prisma.assessment.create({
    data: {
      title: f.title,
      type: f.type,
      description: f.description || null,
      courseId,
      totalMarks: f.totalMarks,
      date: parseDateInput(f.date),
      createdById: user.id,
    },
    select: { id: true },
  });

  revalidatePath(base);
  redirect(`${base}/${created.id}?created=1`);
}

export async function updateAssessment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { base, assessment } = await ownedAssessment(id);
  const f = readFields(formData);
  if (!f.valid) redirect(`${base}/${id}?error=required`);

  // Lowering the total must not leave marks above it.
  const above = await prisma.assessmentMark.count({
    where: { assessmentId: assessment.id, marks: { gt: f.totalMarks } },
  });
  if (above > 0) redirect(`${base}/${id}?error=total`);

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      title: f.title,
      type: f.type,
      description: f.description || null,
      totalMarks: f.totalMarks,
      date: parseDateInput(f.date),
    },
  });

  revalidatePath(`${base}/${id}`);
  revalidatePath("/student/assessments");
  redirect(`${base}/${id}?updated=1`);
}

/**
 * Saves every row of the marks sheet. Per student:
 *  - status MARKED (or blank) + marks  -> marked
 *  - status ABSENT / NOT_SUBMITTED      -> saved without marks
 *  - blank status and blank marks       -> no record (not entered)
 */
export async function saveAssessmentMarks(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { base, assessment } = await ownedAssessment(id);

  const studentIds = Array.from(
    new Set(formData.getAll("studentId").map((v) => String(v)).filter(Boolean)),
  );
  // Only students of this course (who are not dropout/passout) can be marked.
  const allowed = new Set(
    (
      await prisma.student.findMany({
        where: { id: { in: studentIds }, courseId: assessment.courseId },
        select: { id: true },
      })
    ).map((s) => s.id),
  );

  const upserts: {
    studentId: string;
    status: "MARKED" | "ABSENT" | "NOT_SUBMITTED";
    marks: number | null;
    remarks: string | null;
  }[] = [];
  const clear: string[] = [];
  let invalid = false;

  for (const studentId of studentIds) {
    if (!allowed.has(studentId)) continue;
    const status = String(formData.get(`status_${studentId}`) ?? "");
    const rawMarks = String(formData.get(`marks_${studentId}`) ?? "").trim();
    const remarks = String(formData.get(`remarks_${studentId}`) ?? "").trim().slice(0, 300) || null;

    if (status === "ABSENT" || status === "NOT_SUBMITTED") {
      upserts.push({ studentId, status, marks: null, remarks });
      continue;
    }
    if (rawMarks === "") {
      clear.push(studentId);
      continue;
    }
    const marks = Math.round(Number(rawMarks) * 100) / 100;
    if (!Number.isFinite(marks) || marks < 0 || marks > assessment.totalMarks) {
      invalid = true;
      continue;
    }
    upserts.push({ studentId, status: "MARKED", marks, remarks });
  }

  if (invalid) redirect(`${base}/${id}?error=marks`);

  await prisma.$transaction([
    ...upserts.map((u) =>
      prisma.assessmentMark.upsert({
        where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: u.studentId } },
        create: { assessmentId: assessment.id, ...u },
        update: { status: u.status, marks: u.marks, remarks: u.remarks },
      }),
    ),
    prisma.assessmentMark.deleteMany({
      where: { assessmentId: assessment.id, studentId: { in: clear } },
    }),
  ]);

  revalidatePath(`${base}/${id}`);
  revalidatePath(base);
  revalidatePath("/student/assessments");
  redirect(`${base}/${id}?saved=1`);
}

export async function deleteAssessment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { base, assessment } = await ownedAssessment(id);
  await prisma.assessment.delete({ where: { id: assessment.id } });
  revalidatePath(base);
  revalidatePath("/student/assessments");
  redirect(`${base}?deleted=1`);
}
