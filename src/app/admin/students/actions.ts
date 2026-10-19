"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { admissionNo as genAdmissionNo } from "@/lib/utils";

export async function createStudent(formData: FormData) {
  await requireUser("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cnic = String(formData.get("cnic") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!name || !email) {
    redirect("/admin/students?error=required");
  }

  if (password.length < 6) {
    redirect("/admin/students?error=password");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirect("/admin/students?error=email");
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "STUDENT",
      phone: phone || null,
      student: {
        create: {
          admissionNo: genAdmissionNo("SKT"),
          cnic: cnic || null,
          gender: gender || null,
          address: address || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          courseId: courseId || null,
        },
      },
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin");

  redirect("/admin/students?created=1");
}

export async function deleteStudent(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const student = await prisma.student.findUnique({ where: { id } });
  if (student) {
    await prisma.user.delete({ where: { id: student.userId } });
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

export async function updateStudent(formData: FormData) {
  await requireUser("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cnic = String(formData.get("cnic") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE").trim() || "ACTIVE";

  if (!name || !email) {
    redirect("/admin/students?error=required");
  }

  if (password && password.length < 6) {
    redirect("/admin/students?error=password");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && exists.id !== student.userId) {
    redirect("/admin/students?error=email");
  }

  await prisma.user.update({
    where: { id: student.userId },
    data: {
      name,
      email,
      phone: phone || null,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await prisma.student.update({
    where: { id },
    data: {
      cnic: cnic || null,
      gender: gender || null,
      address: address || null,
      guardianName: guardianName || null,
      guardianPhone: guardianPhone || null,
      courseId: courseId || null,
    },
  });

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

  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
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
    seen.add(email);
    valid.push({ row, line });
  });

  const stamp = Date.now().toString().slice(-6);
  let imported = 0;

  for (let i = 0; i < valid.length; i++) {
    const { row, line } = valid[i];
    const courseTitle = cell(row, ix.course).toLowerCase();
    try {
      await prisma.user.create({
        data: {
          name: cell(row, ix.name),
          email: cell(row, ix.email).toLowerCase(),
          password: await bcrypt.hash(cell(row, ix.password), 10),
          role: "STUDENT",
          phone: cell(row, ix.phone) || null,
          student: {
            create: {
              admissionNo: `SKT-${stamp}-${String(i + 1).padStart(3, "0")}`,
              cnic: cell(row, ix.cnic) || null,
              gender: cell(row, ix.gender) || null,
              address: cell(row, ix.address) || null,
              guardianName: cell(row, ix.guardianName) || null,
              guardianPhone: cell(row, ix.guardianPhone) || null,
              courseId: courseTitle ? (courseByTitle.get(courseTitle) ?? null) : null,
            },
          },
        },
      });
      imported++;
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
