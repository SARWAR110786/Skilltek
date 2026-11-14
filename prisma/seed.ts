// First-time setup for SkillTek Institute.
//
// Default (safe) mode — run once after the first deploy:
//   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run db:seed
// It creates the institute settings row (if missing) and the admin account
// (if no admin exists yet). Existing data is never touched.
//
// Reset mode — WIPES EVERY TABLE first. Only for a fresh/test database:
//   SEED_RESET=1 ALLOW_DESTRUCTIVE_SEED=1 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const ADMIN_NAME = (process.env.ADMIN_NAME ?? "Administrator").trim();

const RESET = process.env.SEED_RESET === "1";
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(DATABASE_URL);

async function wipeAll() {
  if (!isLocal && process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
    console.error(
      "Refusing to reset: this WIPES ALL DATA and the database is not local.\n" +
        "Re-run with ALLOW_DESTRUCTIVE_SEED=1 if you really mean it.",
    );
    process.exit(1);
  }
  console.log("Clearing all existing data...");
  // Children first.
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.assignmentFile.deleteMany();
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
}

async function main() {
  if (RESET) await wipeAll();

  const existingSetting = await prisma.setting.findUnique({ where: { id: "singleton" } });
  if (!existingSetting) {
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
  } else {
    console.log("Institute settings already exist — left unchanged.");
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    console.log("An admin account already exists — no new admin created.");
    return;
  }

  if (!ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
    console.error("Set ADMIN_EMAIL to a valid email address to create the admin account.");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
    console.error("Set ADMIN_PASSWORD (8-72 characters) to create the admin account.");
    process.exit(1);
  }

  console.log("Creating admin account...");
  await prisma.user.create({
    data: {
      name: ADMIN_NAME || "Administrator",
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });

  console.log(`\nSeed complete. Admin login: ${ADMIN_EMAIL} (password not printed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
