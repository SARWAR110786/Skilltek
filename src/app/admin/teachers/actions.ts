"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { normalizeCnic, normalizePhone } from "@/lib/validation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TeacherInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  cnic: string;
  courseIds: string[];
};

function readTeacherForm(formData: FormData): TeacherInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .toLowerCase()
      .trim(),
    password: String(formData.get("password") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    cnic: String(formData.get("cnic") ?? "").trim(),
    courseIds: [
      ...new Set(
        formData
          .getAll("courseIds")
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    ],
  };
}

function validateTeacher(
  input: TeacherInput,
  requirePassword: boolean,
): string | null {
  if (
    !input.name ||
    !input.email ||
    !input.phone ||
    !input.cnic ||
    input.courseIds.length === 0 ||
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
  return null;
}

async function coursesExist(courseIds: string[]): Promise<boolean> {
  const count = await prisma.course.count({
    where: { id: { in: courseIds } },
  });
  return count === courseIds.length;
}

export async function createTeacher(formData: FormData) {
  await requireUser("ADMIN");

  const input = readTeacherForm(formData);
  const error = validateTeacher(input, true);
  if (error) {
    redirect(`/admin/teachers?error=${error}`);
  }

  if (!(await coursesExist(input.courseIds))) {
    redirect("/admin/teachers?error=course");
  }

  const exists = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (exists) {
    redirect("/admin/teachers?error=email");
  }

  const hashed = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: "TEACHER",
      phone: normalizePhone(input.phone) ?? input.phone,
      teacher: { create: { cnic: normalizeCnic(input.cnic) } },
    },
    include: { teacher: true },
  });

  if (user.teacher) {
    await prisma.course.updateMany({
      where: { id: { in: input.courseIds } },
      data: { teacherId: user.teacher.id },
    });
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  revalidatePath("/admin/courses");

  redirect("/admin/teachers?created=1");
}

export async function deleteTeacher(formData: FormData) {
  await requireUser("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (teacher) {
    await prisma.user.delete({ where: { id: teacher.userId } });
  }
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
}

export async function updateTeacher(formData: FormData) {
  await requireUser("ADMIN");

  const teacherId = String(formData.get("id") ?? "");
  if (!teacherId) return;

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return;

  const input = readTeacherForm(formData);
  const error = validateTeacher(input, false);
  if (error) {
    redirect(`/admin/teachers?edit=${teacherId}&error=${error}`);
  }

  if (!(await coursesExist(input.courseIds))) {
    redirect(`/admin/teachers?edit=${teacherId}&error=course`);
  }

  const exists = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (exists && exists.id !== teacher.userId) {
    redirect(`/admin/teachers?edit=${teacherId}&error=email`);
  }

  await prisma.user.update({
    where: { id: teacher.userId },
    data: {
      name: input.name,
      email: input.email,
      phone: normalizePhone(input.phone) ?? input.phone,
      ...(input.password
        ? { password: await bcrypt.hash(input.password, 10) }
        : {}),
    },
  });

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { cnic: normalizeCnic(input.cnic) },
  });

  await prisma.course.updateMany({
    where: { teacherId, id: { notIn: input.courseIds } },
    data: { teacherId: null },
  });
  await prisma.course.updateMany({
    where: { id: { in: input.courseIds } },
    data: { teacherId },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  redirect("/admin/teachers?updated=1");
}
