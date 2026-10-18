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
  const password = String(formData.get("password") ?? "").trim() || "student123";
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

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && exists.id !== student.userId) {
    redirect("/admin/students?error=email");
  }

  await prisma.user.update({
    where: { id: student.userId },
    data: { name, email, phone: phone || null, status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" },
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
