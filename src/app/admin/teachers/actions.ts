"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function createTeacher(formData: FormData) {
  await requireUser("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cnic = String(formData.get("cnic") ?? "").trim();
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!name || !email) {
    redirect("/admin/teachers?error=required");
  }

  if (password.length < 6) {
    redirect("/admin/teachers?error=password");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirect("/admin/teachers?error=email");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "TEACHER",
      phone: phone || null,
      teacher: { create: { cnic: cnic || null } },
    },
    include: { teacher: true },
  });

  if (courseIds.length && user.teacher) {
    await prisma.course.updateMany({
      where: { id: { in: courseIds } },
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

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cnic = String(formData.get("cnic") ?? "").trim();
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!name || !email) {
    redirect("/admin/teachers?error=required");
  }

  if (password && password.length < 6) {
    redirect("/admin/teachers?error=password");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && exists.id !== teacher.userId) {
    redirect("/admin/teachers?error=email");
  }

  await prisma.user.update({
    where: { id: teacher.userId },
    data: {
      name,
      email,
      phone: phone || null,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { cnic: cnic || null },
  });

  await prisma.course.updateMany({
    where: { teacherId, id: { notIn: courseIds } },
    data: { teacherId: null },
  });
  await prisma.course.updateMany({
    where: { id: { in: courseIds } },
    data: { teacherId },
  });

  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  redirect("/admin/teachers?updated=1");
}
