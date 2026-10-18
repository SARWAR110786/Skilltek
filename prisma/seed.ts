import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(DATABASE_URL);
if (!isLocal && process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
  console.error(
    "Refusing to run: this seed WIPES ALL DATA and the database is not local.\n" +
      "To proceed against a remote/production database, re-run with ALLOW_DESTRUCTIVE_SEED=1",
  );
  process.exit(1);
}

const ADMIN_EMAIL = "sarwaralii785@gmail.com";
const ADMIN_PASSWORD = "sarwar123";

async function main() {
  console.log("Clearing all existing data...");

  // Delete in dependency-safe order (children first).
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignmentAttachment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.quizBankQuestion.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log("Creating institute settings...");
  await prisma.setting.create({
    data: {
      id: "singleton",
      instituteName: "SkillTek",
      tagline: "Empowering Skills, Shaping Futures",
      email: "theskilltek@gmail.com",
      phone: "0312 2098894",
      address: "Near Dargah Shah Mubeen, Beside Dr Luchman Clinic, Doctor Street, Thatta",
      currency: "PKR",
      paymentInstructions:
        "Pay online or at any branch, then submit a copy of this challan to the accounts office.",
      aiEnabled: false,
    },
  });

  console.log("Creating admin account...");
  await prisma.user.create({
    data: {
      name: "Sarwar",
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });

  console.log("\nSeed complete!");
  console.log(`  Admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
