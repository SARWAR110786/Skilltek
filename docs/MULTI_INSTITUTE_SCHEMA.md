# SkillTek — Multi-Institute Database Design

This is the target schema for **one website, many institutes**. Read it before
you migrate. Nothing here touches your live database yet — it is a plan.

The rule of the whole design: **every table that holds institute data carries
`instituteId`, and every login knows its `instituteId`.**

---

## 1. The idea in one picture

```
Institute (tenant / customer)
   ├── Users (admin, teachers, students)
   ├── Courses → Students, Quizzes, Assignments
   ├── Challans, Attendance
   ├── Notices, Enquiries
   └── Setting (one row per institute: name, logo, bank, AI on/off)
```

Every child row points back to its `Institute`. When someone logs in, their
session stores `instituteId`, and every query filters `where: { instituteId }`.

---

## 2. Big changes from today's schema

| Change | Why |
|---|---|
| New `Institute` model | The customer/tenant itself |
| Add `instituteId` to every tenant table | Isolation between institutes |
| `User.email` unique **per institute**, not globally | Two institutes can both have `admin@gmail.com` |
| `Student.admissionNo` unique **per institute** | Each institute numbers its own students from 1 |
| `Challan.challanNo` unique **per institute** | Same reason |
| `Setting` becomes **one row per institute** | Each institute has its own name/logo/bank |
| (Optional) `role` gains `SUPERADMIN` | YOU, to manage all institutes |

---

## 3. New models

```prisma
// ------------------------- TENANT -------------------------

model Institute {
  id        String   @id @default(cuid())
  slug      String   @unique          // URL name, e.g. "lahore-academy"
  name      String                    // display name, e.g. "Lahore Academy"
  status    String   @default("ACTIVE") // ACTIVE | SUSPENDED (unpaid)
  plan      String   @default("STARTER") // STARTER | STANDARD | PREMIUM
  domain    String?  @unique          // optional: their own domain later
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  settings       Setting?
  users          User[]
  courses        Course[]
  teachers       Teacher[]
  students       Student[]
  challans       Challan[]
  attendance     Attendance[]
  notices        Notice[]
  enquiries      Enquiry[]
  bankQuestions  QuizBankQuestion[]
  quizzes        Quiz[]
  assignments    Assignment[]
}
```

Add `SUPERADMIN` to the role enum (only if you want an owner panel now):

```prisma
enum Role {
  SUPERADMIN
  ADMIN
  TEACHER
  STUDENT
}
```

---

## 4. Every tenant model gets these two lines

Add to `User`, `Course`, `Teacher`, `Student`, `Challan`, `Attendance`,
`Notice`, `Enquiry`, `QuizBankQuestion`, `Quiz`, `Assignment`:

```prisma
  instituteId String
  institute   Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)

  @@index([instituteId])
```

---

## 5. Uniqueness fixes (critical — a reviewer will look for this)

```prisma
model User {
  // REMOVE:  email String @unique
  email String
  @@unique([instituteId, email])
}

model Student {
  // REMOVE:  admissionNo String @unique
  admissionNo String
  @@unique([instituteId, admissionNo])
}

model Challan {
  // REMOVE:  challanNo String @unique
  challanNo String
  @@unique([instituteId, challanNo])
}

model Setting {
  // REMOVE:  id String @id @default("singleton")
  id          String @id @default(cuid())
  instituteId String @unique
  institute   Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
}
```

---

## 6. Full schema (copy-paste target)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ------------------------- ENUMS -------------------------

enum Role {
  SUPERADMIN
  ADMIN
  TEACHER
  STUDENT
}

enum UserStatus { ACTIVE INACTIVE }
enum AttendanceStatus { PRESENT ABSENT }
enum NoticeTarget { ALL TEACHERS STUDENTS }
enum ChallanStatus { UNPAID PARTIAL PAID }
enum EnquiryStatus { NEW CONTACTED ADMITTED CLOSED }
enum QuizStatus { DRAFT ASSIGNED }
enum AssignStatus { DRAFT ASSIGNED }

// ------------------------- TENANT -------------------------

model Institute {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  status    String   @default("ACTIVE")
  plan      String   @default("STARTER")
  domain    String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  settings      Setting?
  users         User[]
  courses       Course[]
  teachers      Teacher[]
  students      Student[]
  challans      Challan[]
  attendance    Attendance[]
  notices       Notice[]
  enquiries     Enquiry[]
  bankQuestions QuizBankQuestion[]
  quizzes       Quiz[]
  assignments   Assignment[]
}

// ------------------------- CORE USERS -------------------------

model User {
  id          String     @id @default(cuid())
  instituteId String
  name        String
  email       String
  password    String
  role        Role       @default(STUDENT)
  status      UserStatus @default(ACTIVE)
  phone       String?
  avatarUrl   String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  institute        Institute    @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  teacher          Teacher?
  student          Student?
  notices          Notice[]     @relation("NoticeCreatedBy")
  markedAttendance Attendance[] @relation("AttendanceMarkedBy")

  @@unique([instituteId, email])
  @@index([instituteId])
}

// ------------------------- ACADEMICS -------------------------

model Course {
  id             String   @id @default(cuid())
  instituteId    String
  title          String
  description    String?
  durationMonths Int      @default(3)
  active         Boolean  @default(true)
  teacherId      String?
  createdAt      DateTime @default(now())

  institute     Institute          @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  teacher       Teacher?           @relation(fields: [teacherId], references: [id], onDelete: SetNull)
  students      Student[]
  enquiries     Enquiry[]
  bankQuestions QuizBankQuestion[]
  quizzes       Quiz[]
  assignments   Assignment[]

  @@index([instituteId])
}

model Teacher {
  id          String    @id @default(cuid())
  instituteId String
  userId      String    @unique
  cnic        String?
  joiningDate DateTime?
  bio         String?
  createdAt   DateTime  @default(now())

  institute     Institute          @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  courses       Course[]
  bankQuestions QuizBankQuestion[]
  quizzes       Quiz[]
  assignments   Assignment[]

  @@index([instituteId])
}

model Student {
  id            String     @id @default(cuid())
  instituteId   String
  userId        String     @unique
  admissionNo   String
  cnic          String?
  dateOfBirth   DateTime?
  gender        String?
  address       String?
  guardianName  String?
  guardianPhone String?
  courseId      String?
  admissionDate DateTime   @default(now())
  status        UserStatus @default(ACTIVE)

  institute   Institute              @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  user        User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course?                @relation(fields: [courseId], references: [id], onDelete: SetNull)
  attendance  Attendance[]
  challans    Challan[]
  quizAttempts QuizAttempt[]
  submissions AssignmentSubmission[]

  @@unique([instituteId, admissionNo])
  @@index([instituteId])
}

model Challan {
  id            String        @id @default(cuid())
  instituteId   String
  challanNo     String
  studentId     String
  title         String
  feeMonth      Int?
  feeYear       Int?
  amount        Float
  items         Json?
  lateFee       Float         @default(0)
  paidAmount    Float         @default(0)
  dueDate       DateTime
  status        ChallanStatus @default(UNPAID)
  paidDate      DateTime?
  paymentMethod String?
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  student   Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([instituteId, challanNo])
  @@index([instituteId])
  @@index([studentId])
  @@index([status])
  @@index([dueDate])
}

model Attendance {
  id          String           @id @default(cuid())
  instituteId String
  studentId   String
  date        DateTime
  status      AttendanceStatus
  markedById  String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  student   Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  markedBy  User?     @relation("AttendanceMarkedBy", fields: [markedById], references: [id], onDelete: SetNull)

  @@unique([studentId, date])
  @@index([instituteId])
  @@index([date])
}

// ------------------------- CONTENT -------------------------

model Notice {
  id          String       @id @default(cuid())
  instituteId String
  title       String
  body        String
  target      NoticeTarget @default(ALL)
  pinned      Boolean      @default(false)
  createdById String?
  createdAt   DateTime     @default(now())

  institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  createdBy User?     @relation("NoticeCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  @@index([instituteId])
}

model Enquiry {
  id          String        @id @default(cuid())
  instituteId String
  name        String
  email       String?
  phone       String?
  courseId    String?
  service     String?
  message     String?
  status      EnquiryStatus @default(NEW)
  createdAt   DateTime      @default(now())

  institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  course    Course?   @relation(fields: [courseId], references: [id], onDelete: SetNull)

  @@index([instituteId])
}

// ------------------------- QUIZZES -------------------------

model QuizBankQuestion {
  id            String   @id @default(cuid())
  instituteId   String
  teacherId     String
  courseId      String?
  text          String
  optionA       String
  optionB       String
  optionC       String?
  optionD       String?
  correctOption String
  marks         Int      @default(1)
  createdAt     DateTime @default(now())

  institute     Institute      @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  teacher       Teacher        @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  course        Course?        @relation(fields: [courseId], references: [id], onDelete: SetNull)
  quizQuestions QuizQuestion[]

  @@index([instituteId])
  @@index([teacherId])
  @@index([courseId])
}

model Quiz {
  id              String     @id @default(cuid())
  instituteId     String
  title           String
  description     String?
  courseId        String
  teacherId       String
  durationMinutes Int        @default(15)
  totalMarks      Int        @default(0)
  status          QuizStatus @default(DRAFT)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  institute Institute      @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  course    Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  teacher   Teacher        @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  attempts  QuizAttempt[]

  @@index([instituteId])
  @@index([courseId])
  @@index([teacherId])
}

model QuizQuestion {
  id         String @id @default(cuid())
  quizId     String
  questionId String
  order      Int    @default(0)

  quiz     Quiz             @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question QuizBankQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([quizId, questionId])
}

model QuizAttempt {
  id          String   @id @default(cuid())
  quizId      String
  studentId   String
  score       Int      @default(0)
  total       Int      @default(0)
  answers     Json?
  violated    Boolean  @default(false)
  submittedAt DateTime @default(now())

  quiz    Quiz    @relation(fields: [quizId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([quizId, studentId])
}

// ----------------------- ASSIGNMENTS -----------------------

model Assignment {
  id          String       @id @default(cuid())
  instituteId String
  title       String
  description String?
  courseId    String
  teacherId   String
  marks       Int          @default(0)
  dueDate     DateTime?
  status      AssignStatus @default(DRAFT)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  institute   Institute              @relation(fields: [instituteId], references: [id], onDelete: Cascade)
  course      Course                 @relation(fields: [courseId], references: [id], onDelete: Cascade)
  teacher     Teacher                @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  attachments AssignmentAttachment[]
  submissions AssignmentSubmission[]

  @@index([instituteId])
  @@index([courseId])
  @@index([teacherId])
}

model AssignmentAttachment {
  id           String   @id @default(cuid())
  assignmentId String
  fileName     String
  mimeType     String
  size         Int
  data         Bytes
  createdAt    DateTime @default(now())

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)

  @@index([assignmentId])
}

model AssignmentSubmission {
  id            String   @id @default(cuid())
  assignmentId  String
  studentId     String
  note          String?
  marksObtained Int?
  submittedAt   DateTime @default(now())

  assignment Assignment     @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student    Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  files      AssignmentFile[]

  @@unique([assignmentId, studentId])
}

model AssignmentFile {
  id           String   @id @default(cuid())
  submissionId String
  fileName     String
  mimeType     String
  size         Int
  data         Bytes
  createdAt    DateTime @default(now())

  submission AssignmentSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
}

// ------------------------- SETTINGS -------------------------

model Setting {
  id                  String   @id @default(cuid())
  instituteId         String   @unique
  instituteName       String   @default("SkillTek")
  tagline             String   @default("Empowering Skills, Shaping Futures")
  email               String   @default("info@skilltek.com")
  phone               String   @default("+92 000 0000000")
  address             String   @default("123 Education Street")
  logoUrl             String?
  currency            String   @default("PKR")
  bankName            String?
  bankBranch          String?
  bankAccountTitle    String?
  bankAccountNumber   String?
  bankIban            String?
  paymentInstructions String?
  aiEnabled           Boolean  @default(false)
  updatedAt           DateTime @updatedAt

  institute Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
}
```

---

## 7. How to migrate safely (you have real data)

Do these in order. Test each step locally against a **copy** of the data first.

1. Make a **Neon/Supabase backup** before touching anything.
2. Add the `Institute` model and the nullable `instituteId` columns first:
   `instituteId String?` (optional) — run migration.
3. Insert **one** Institute row for SkillTek. Copy its `id`.
4. Backfill: `UPDATE "User" SET "instituteId" = '<id>'` (and every table).
   Also insert one `Setting` row per institute.
5. Change `instituteId` from optional to **required** — run migration.
6. Drop old global uniques, add the new per-institute uniques — run migration.
7. Update the seed script to create an Institute first.

**Never** run the destructive seed on the live DB.

---

## 8. Code changes after the schema (summary)

- `signSession` in `src/lib/auth.ts` adds `instituteId` to the JWT.
- `getSession()` now returns `instituteId`.
- Every `prisma.*.findMany/findUnique/update/delete` adds
  `where: { instituteId: session.instituteId }`.
- Every `create` sets `instituteId`.
- Public site reads `Setting` by the institute resolved from the URL slug.
- Best practice: a helper `tenantWhere(session)` so nobody forgets the filter.

---

## 9. Switching to Supabase (beginner steps)

1. Go to supabase.com → **New project**. Pick a region close to Pakistan
   (Singapore / Mumbai). Save the database password.
2. Project → **Settings → Database → Connection string**. Copy two:
   - **Transaction pooler** (port `6543`) → your `DATABASE_URL`
   - **Direct / Session** (port `5432`) → your `DIRECT_URL`
3. In Vercel → Settings → Environment Variables, replace `DATABASE_URL` and
   `DIRECT_URL` with the Supabase ones (Production + Preview).
4. In `.env` locally, replace the Neon URLs with Supabase URLs.
5. Run `npx prisma migrate deploy` to create all tables in Supabase.
6. Create your first institute + admin (adapt the seed, or do it manually).
7. Enable **Database → Backups** (Daily) in Supabase — one toggle.
8. (Later) Use **Storage** for assignment files instead of storing `Bytes`.

That's it — Supabase is now your database, Vercel still runs the site.

---

## 10. Optional but recommended

- **Super-admin panel** (`role = SUPERADMIN`) to create/suspend institutes.
- **Plan limits**: enforce max students/courses per `Institute.plan`.
- **Create one tenant inside the app**: a "Register your institute" wizard.
- **Rate limiting** on shared infra: move from in-memory `Map` to Upstash Redis.
