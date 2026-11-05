import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Mcq = z.object({
  text: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
});

const Body = z.object({
  courseId: z.string().min(1),
  questions: z.array(Mcq).min(1).max(20),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (session.role !== "TEACHER" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.id },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher profile not found." }, { status: 403 });
  }

  const course = await prisma.course.findUnique({
    where: { id: body.courseId },
    select: { id: true, teacherId: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  if (session.role === "TEACHER" && course.teacherId !== teacher.id) {
    return NextResponse.json({ error: "Not assigned to this course." }, { status: 403 });
  }

  const created = await prisma.$transaction(
    body.questions.map((q) =>
      prisma.quizBankQuestion.create({
        data: {
          teacherId: teacher.id,
          courseId: body.courseId,
          text: q.text,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          marks: 1,
        },
      }),
    ),
  );

  return NextResponse.json({ count: created.length });
}
