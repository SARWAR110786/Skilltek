-- Add a short course code used to build student roll numbers.
ALTER TABLE "Course" ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
