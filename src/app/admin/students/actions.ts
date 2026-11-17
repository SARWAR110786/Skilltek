"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import {
  formatRollNo,
  parseRollSerial,
  rollPrefix,
  rollYear,
} from "@/lib/roll-number";
import { nextNumericCourseCode } from "@/lib/course-code";
import { normalizeCnic, normalizePhone } from "@/lib/validation";
import { normalizeStudentState } from "@/lib/student-status";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ["Male", "Female"];

type StudentInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  cnic: string;
  courseId: string;
  guardianName: string;
  guardianPhone: string;
  gender: string;
  address: string;
};

function readStudentForm(formData: FormData): StudentInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    cnic: String(formData.get("cnic") ?? "").trim(),
    courseId: String(formData.get("courseId") ?? "").trim(),
    guardianName: String(formData.get("guardianName") ?? "").trim(),
    guardianPhone: String(formData.get("guardianPhone") ?? "").trim(),
    gender: String(formData.get("gender") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };
}

function readStudentState(formData: FormData) {
  return normalizeStudentState(formData.get("status"));
}

function validateStudent(input: StudentInput, requirePassword: boolean): string | null {
  if (
    !input.name ||
    !input.email ||
    !input.phone ||
    !input.cnic ||
    !input.gender ||
    !input.courseId ||
    !input.guardianName ||
    !input.guardianPhone ||
    (requirePassword && !input.password)
  ) {
    return "required";
  }
  if (input.name.length < 2 || input.name.length > 80) return "name";
  if (input.email.length > 254 || !EMAIL_RE.test(input.email)) {
    return "invalidEmail";
  }
  if (
    (requirePassword || input.password) &&
    (input.password.length < 6 || input.password.length > 72)
  ) {
    return "password";
  }
  if (!normalizePhone(input.phone)) return "phone";
  if (!normalizeCnic(input.cnic)) return "cnic";
  if (!GENDERS.includes(input.gender)) return "gender";
  if (input.guardianName.length < 2 || input.guardianName.length > 80) {
    return "guardian";
  }
  if (!normalizePhone(input.guardianPhone)) return "guardianPhone";
  if (input.address.length > 200) {
    return "address";
  }
  return null;
}

async function courseExists(courseId: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  return Boolean(course);
}

type CourseCodeSource = { id: string; code: string | null };

async function ensureCourseCode(course: CourseCodeSource): Promise<string> {
  if (course.code) return course.code;

  const courses = await prisma.course.findMany({ select: { code: true } });
  const code = nextNumericCourseCode(courses.map((c) => c.code));

  await prisma.course.update({ where: { id: course.id }, data: { code } });
  return code;
}

async function nextRollNo(
  courseId: string | null,
  date: Date = new Date(),
): Promise<string> {
  let code = "GEN";

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, code: true },
    });
    if (!course) throw new Error("Course not found");
    code = await ensureCourseCode(course);
  }

  const year = rollYear(date);
  const prefix = rollPrefix(year, code);
  const existing = await prisma.student.findMany({
    where: { admissionNo: { startsWith: prefix } },
    select: { admissionNo: true },
  });
  const lastSerial = existing.reduce(
    (highest, row) => Math.max(highest, parseRollSerial(row.admissionNo, prefix)),
    0,
  );

  return formatRollNo(year, code, lastSerial + 1);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createStudent(formData: FormData) {
  await requireUser("ADMIN");

  const input = readStudentForm(formData);
  const state = readStudentState(formData);
  const invalid = validateStudent(input, true);
  if (invalid) {
    redirect(`/admin/students?error=${invalid}`);
  }
  if (!(await courseExists(input.courseId))) {
    redirect("/admin/students?error=course");
  }

  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    redirect("/admin/students?error=email");
  }

  const hashed = await bcrypt.hash(input.password, 10);
  const admissionDate = new Date();

  for (let attempt = 1; attempt <= 5; attempt++) {
    const rollNo = await nextRollNo(input.courseId, admissionDate);
    try {
      await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashed,
          role: "STUDENT",
          status: state.status,
          phone: normalizePhone(input.phone) ?? input.phone,
          student: {
            create: {
              admissionNo: rollNo,
              status: state.status,
              exitReason: state.exitReason,
              cnic: normalizeCnic(input.cnic),
              gender: input.gender,
              address: input.address || null,
              guardianName: input.guardianName,
              guardianPhone:
                normalizePhone(input.guardianPhone) ?? input.guardianPhone,
              courseId: input.courseId,
            },
          },
        },
      });
      break;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 5) throw error;
      const emailTaken = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (emailTaken) redirect("/admin/students?error=email");
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  redirect("/admin/students?created=1");
}

export async function deleteStudent(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const student = await prisma.student.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (student) {
    await prisma.user.delete({ where: { id: student.userId } });
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/challans");
}

export async function updateStudent(formData: FormData) {
  await requireUser("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return;

  const input = readStudentForm(formData);
  const state = readStudentState(formData);

  const invalid = validateStudent(input, false);
  if (invalid) {
    redirect(`/admin/students?error=${invalid}&edit=${id}`);
  }
  if (!(await courseExists(input.courseId))) {
    redirect(`/admin/students?error=course&edit=${id}`);
  }

  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists && exists.id !== student.userId) {
    redirect(`/admin/students?error=email&edit=${id}`);
  }

  await prisma.user.update({
    where: { id: student.userId },
    data: {
      name: input.name,
      email: input.email,
      phone: normalizePhone(input.phone) ?? input.phone,
      status: state.status,
      ...(input.password
        ? { password: await bcrypt.hash(input.password, 10) }
        : {}),
    },
  });

  const courseChanged = student.courseId !== input.courseId;
  let newRollNo = courseChanged ? await nextRollNo(input.courseId) : null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.student.update({
        where: { id },
        data: {
          ...(newRollNo ? { admissionNo: newRollNo } : {}),
          status: state.status,
          exitReason: state.exitReason,
          cnic: normalizeCnic(input.cnic),
          gender: input.gender,
          address: input.address || null,
          guardianName: input.guardianName,
          guardianPhone:
            normalizePhone(input.guardianPhone) ?? input.guardianPhone,
          courseId: input.courseId,
        },
      });
      break;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 5) throw error;
      newRollNo = await nextRollNo(input.courseId);
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  redirect("/admin/students?updated=1");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export async function importStudents(formData: FormData) {
  await requireUser("ADMIN");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/students?error=nofile");
  }
  if (file.size > 2_000_000) {
    redirect("/admin/students?error=bigfile");
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    redirect("/admin/students?error=csvempty");
  }
  if (rows.length > 301) {
    redirect("/admin/students?error=csvbig");
  }

  const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };
  const ix = {
    name: col("name", "fullname", "studentname"),
    email: col("email", "emailaddress"),
    password: col("password", "pass"),
    phone: col("phone", "mobilenumber", "contact"),
    cnic: col("cnic"),
    gender: col("gender"),
    course: col("course", "coursename", "program"),
    guardianName: col("guardianname", "guardian"),
    guardianPhone: col("guardianphone", "guardiancontact"),
    address: col("address"),
  };
  if (ix.name === -1 || ix.email === -1) {
    redirect("/admin/students?error=csvheader");
  }

  const cell = (row: string[], i: number) => (i === -1 ? "" : (row[i] ?? "").trim());
  const dataRows = rows.slice(1);

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, code: true },
  });
  const courseByTitle = new Map(courses.map((c) => [c.title.toLowerCase(), c.id]));

  const emails = dataRows
    .map((r) => cell(r, ix.email).toLowerCase())
    .filter(Boolean);
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((u) => u.email));

  const errors: string[] = [];
  const seen = new Set<string>();
  const valid: { row: string[]; line: number }[] = [];

  dataRows.forEach((row, idx) => {
    const line = idx + 2;
    const name = cell(row, ix.name);
    const email = cell(row, ix.email).toLowerCase();
    const password = cell(row, ix.password);
    const courseTitle = cell(row, ix.course).toLowerCase();
    const phone = cell(row, ix.phone);
    const cnic = cell(row, ix.cnic);
    const guardianPhone = cell(row, ix.guardianPhone);

    if (!name && !email && !password) return; // blank row
    if (!name) {
      errors.push(`Row ${line}: name is required`);
      return;
    }
    if (!email || !email.includes("@")) {
      errors.push(`Row ${line}: valid email is required`);
      return;
    }
    if (password.length < 6) {
      errors.push(`Row ${line}: password must be at least 6 characters`);
      return;
    }
    if (existingSet.has(email)) {
      errors.push(`Row ${line}: ${email} already exists`);
      return;
    }
    if (seen.has(email)) {
      errors.push(`Row ${line}: duplicate email inside the file`);
      return;
    }
    if (courseTitle && !courseByTitle.has(courseTitle)) {
      errors.push(`Row ${line}: unknown course "${cell(row, ix.course)}"`);
      return;
    }
    if (phone && !normalizePhone(phone)) {
      errors.push(`Row ${line}: invalid phone number`);
      return;
    }
    if (cnic && !normalizeCnic(cnic)) {
      errors.push(`Row ${line}: invalid CNIC (use 13 digits, e.g. 41409-1234567-1)`);
      return;
    }
    if (guardianPhone && !normalizePhone(guardianPhone)) {
      errors.push(`Row ${line}: invalid guardian phone number`);
      return;
    }
    seen.add(email);
    valid.push({ row, line });
  });

  let imported = 0;

  for (let i = 0; i < valid.length; i++) {
    const { row, line } = valid[i];
    const courseTitle = cell(row, ix.course).toLowerCase();
    const courseId = courseTitle ? (courseByTitle.get(courseTitle) ?? null) : null;

    try {
      const password = await bcrypt.hash(cell(row, ix.password), 10);
      let rollNo = await nextRollNo(courseId);

      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await prisma.user.create({
            data: {
              name: cell(row, ix.name),
              email: cell(row, ix.email).toLowerCase(),
              password,
              role: "STUDENT",
              phone: normalizePhone(cell(row, ix.phone)),
              student: {
                create: {
                  admissionNo: rollNo,
                  cnic: normalizeCnic(cell(row, ix.cnic)),
                  gender: cell(row, ix.gender) || null,
                  address: cell(row, ix.address) || null,
                  guardianName: cell(row, ix.guardianName) || null,
                  guardianPhone: normalizePhone(cell(row, ix.guardianPhone)),
                  courseId,
                },
              },
            },
          });
          imported++;
          break;
        } catch (error) {
          if (!isUniqueViolation(error) || attempt === 5) throw error;
          rollNo = await nextRollNo(courseId);
        }
      }
    } catch {
      errors.push(`Row ${line}: could not be saved`);
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  const params = new URLSearchParams({ imported: String(imported), skipped: String(errors.length) });
  if (errors.length) {
    params.set("errors", errors.slice(0, 8).join(" · ").slice(0, 400));
  }
  redirect(`/admin/students?${params.toString()}`);
}
