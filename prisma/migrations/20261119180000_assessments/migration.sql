-- CreateEnum
CREATE TYPE "AssessmentMarkStatus" AS ENUM ('MARKED', 'ABSENT', 'NOT_SUBMITTED');

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMark" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AssessmentMarkStatus" NOT NULL DEFAULT 'MARKED',
    "marks" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_courseId_idx" ON "Assessment"("courseId");

-- CreateIndex
CREATE INDEX "Assessment_date_idx" ON "Assessment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentMark_assessmentId_studentId_key" ON "AssessmentMark"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "AssessmentMark_studentId_idx" ON "AssessmentMark"("studentId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentMark" ADD CONSTRAINT "AssessmentMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same protection as every other table (no Supabase API access).
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentMark" ENABLE ROW LEVEL SECURITY;
