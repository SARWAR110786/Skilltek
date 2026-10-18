import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function dateOnly(days: number) {
  const d = daysFromNow(days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.challan.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log("Seeding settings...");
  await prisma.setting.create({
    data: {
      id: "singleton",
      instituteName: "SkillTek",
      tagline: "Empowering Skills, Shaping Futures",
      email: "info@skilltek.com",
      phone: "+92 300 1234567",
      address: "12 Tech Avenue, Gulberg III, Lahore",
      currency: "PKR",
      bankName: "Meezan Bank",
      bankBranch: "Gulberg III, Lahore",
      bankAccountTitle: "SkillTek Institute",
      bankAccountNumber: "0102 0104 7896 3201",
      bankIban: "PK36MEZN0001020104789632",
      paymentInstructions:
        "Pay online or at any branch, then submit a copy of this challan to the accounts office.",
      aiEnabled: true,
    },
  });

  console.log("Creating users...");
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const admin = await prisma.user.create({
    data: { name: "Site Administrator", email: "admin@skilltek.com", password: await hash("admin123"), role: "ADMIN", phone: "+92 300 1234567" },
  });

  const teacherUser1 = await prisma.user.create({
    data: { name: "Dr. Ayesha Khan", email: "teacher@skilltek.com", password: await hash("teacher123"), role: "TEACHER", phone: "+92 301 2345678" },
  });
  const teacherUser2 = await prisma.user.create({
    data: { name: "Mr. Bilal Ahmed", email: "bilal@skilltek.com", password: await hash("teacher123"), role: "TEACHER", phone: "+92 302 3456789" },
  });

  const teacher1 = await prisma.teacher.create({
    data: { userId: teacherUser1.id, joiningDate: daysFromNow(-400), bio: "Passionate educator with 10 years of industry experience." },
  });
  const teacher2 = await prisma.teacher.create({
    data: { userId: teacherUser2.id, joiningDate: daysFromNow(-250), bio: "Data scientist turned instructor." },
  });

  console.log("Creating courses...");
  const webDev = await prisma.course.create({
    data: { title: "Full-Stack Web Development", description: "Master modern web development with HTML, CSS, JavaScript, React and Node.js.", durationMonths: 6, teacherId: teacher1.id },
  });
  const dataSci = await prisma.course.create({
    data: { title: "Data Science & Machine Learning", description: "Python, statistics, machine learning and real-world data projects.", durationMonths: 8, teacherId: teacher2.id },
  });
  const graphic = await prisma.course.create({
    data: { title: "Graphic Design Essentials", description: "Design principles, Adobe Photoshop, Illustrator and branding.", durationMonths: 3, teacherId: teacher1.id },
  });

  console.log("Creating students...");
  const studentSeeds = [
    { name: "Ali Raza", email: "student@skilltek.com", admissionNo: "SKT-2026-0001", courseId: webDev.id, guardianName: "Raza Khan", guardianPhone: "+92 311 1111111", gender: "Male" },
    { name: "Sara Malik", email: "sara@skilltek.com", admissionNo: "SKT-2026-0002", courseId: webDev.id, guardianName: "Malik Ahmed", guardianPhone: "+92 311 2222222", gender: "Female" },
    { name: "Hamza Tariq", email: "hamza@skilltek.com", admissionNo: "SKT-2026-0003", courseId: webDev.id, guardianName: "Tariq Mehmood", guardianPhone: "+92 311 3333333", gender: "Male" },
    { name: "Fatima Noor", email: "fatima@skilltek.com", admissionNo: "SKT-2026-0004", courseId: dataSci.id, guardianName: "Noor Alam", guardianPhone: "+92 311 4444444", gender: "Female" },
    { name: "Usman Sheikh", email: "usman@skilltek.com", admissionNo: "SKT-2026-0005", courseId: dataSci.id, guardianName: "Sheikh Waseem", guardianPhone: "+92 311 5555555", gender: "Male" },
    { name: "Zainab Iqbal", email: "zainab@skilltek.com", admissionNo: "SKT-2026-0006", courseId: graphic.id, guardianName: "Iqbal Hussain", guardianPhone: "+92 311 6666666", gender: "Female" },
  ];

  const students = [];
  for (const s of studentSeeds) {
    const u = await prisma.user.create({
      data: { name: s.name, email: s.email, password: await hash("student123"), role: "STUDENT", phone: s.guardianPhone },
    });
    const st = await prisma.student.create({
      data: {
        userId: u.id,
        admissionNo: s.admissionNo,
        courseId: s.courseId,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        gender: s.gender,
        admissionDate: daysFromNow(-Math.floor(Math.random() * 90) - 5),
        address: "Lahore, Pakistan",
      },
    });
    students.push(st);
  }

  console.log("Attendance...");
  const attendance: { studentId: string; date: Date; status: "PRESENT" | "ABSENT"; markedById: string }[] = [];
  for (let i = 1; i <= 15; i++) {
    const day = dateOnly(-i);
    if (day.getDay() === 0) continue;
    for (const st of students) {
      attendance.push({
        studentId: st.id,
        date: day,
        status: Math.random() > 0.15 ? "PRESENT" : "ABSENT",
        markedById: teacherUser1.id,
      });
    }
  }
  await prisma.attendance.createMany({ data: attendance });

  console.log("Notices...");
  await prisma.notice.createMany({
    data: [
      { title: "Welcome to SkillTek!", body: "We are excited to have you on board. Please check your course schedule and notices regularly.", target: "ALL", pinned: true, createdById: admin.id },
      { title: "Fee Submission Reminder", body: "Kindly clear your outstanding dues before the end of this month to avoid late fees.", target: "STUDENTS", createdById: admin.id },
      { title: "Midterm Exams Schedule", body: "Midterm exams will be held next month. Detailed schedule will be shared by teachers.", target: "ALL", createdById: admin.id },
    ],
  });

  console.log("Challans...");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const now = new Date();
  const cur = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prev = `${monthNames[prevM]} ${prevY}`;

  let challanSeq = 1;
  const mkChallanNo = () => `CH-${now.getFullYear()}-${String(challanSeq++).padStart(4, "0")}`;

  for (const st of students) {
    const monthly = 5000;
    // previous month (paid)
    await prisma.challan.create({
      data: {
        challanNo: mkChallanNo(),
        studentId: st.id,
        title: `Monthly Fee - ${prev}`,
        feeMonth: prevM + 1,
        feeYear: prevY,
        amount: monthly,
        items: [{ label: "Monthly Fee", amount: monthly }],
        lateFee: 500,
        paidAmount: monthly,
        status: "PAID",
        dueDate: new Date(prevY, prevM, 10),
        paidDate: new Date(prevY, prevM, 7),
        paymentMethod: "Cash",
      },
    });
    // current month (unpaid for some, paid for others)
    const isPaid = Math.random() > 0.5;
    await prisma.challan.create({
      data: {
        challanNo: mkChallanNo(),
        studentId: st.id,
        title: `Monthly Fee - ${cur}`,
        feeMonth: now.getMonth() + 1,
        feeYear: now.getFullYear(),
        amount: monthly,
        items: [{ label: "Monthly Fee", amount: monthly }],
        lateFee: 500,
        paidAmount: isPaid ? monthly : 0,
        status: isPaid ? "PAID" : "UNPAID",
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        paidDate: isPaid ? new Date(now.getFullYear(), now.getMonth(), 5) : null,
        paymentMethod: isPaid ? "Cash" : null,
      },
    });
  }

  console.log("Enquiries...");
  await prisma.enquiry.createMany({
    data: [
      { name: "Imran Yousaf", email: "imran@example.com", phone: "+92 320 7777777", courseId: webDev.id, message: "When does the next FSWD batch start?", status: "NEW" },
      { name: "Nida Fatima", email: "nida@example.com", phone: "+92 321 8888888", courseId: dataSci.id, message: "Do you offer weekend classes for data science?", status: "CONTACTED" },
      { name: "Kamran Ali", email: "kamran@example.com", phone: "+92 322 9999999", courseId: graphic.id, message: "Interested in graphic design course fees.", status: "NEW" },
    ],
  });

  console.log("\nSeed complete!");
  console.log("Demo accounts:");
  console.log("  Admin   -> admin@skilltek.com / admin123");
  console.log("  Teacher -> teacher@skilltek.com / teacher123");
  console.log("  Student -> student@skilltek.com / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
