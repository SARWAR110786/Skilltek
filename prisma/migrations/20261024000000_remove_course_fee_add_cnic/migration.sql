-- Drop the course fee concept entirely.
ALTER TABLE "Course" DROP COLUMN "fee";

-- Add optional CNIC numbers.
ALTER TABLE "Student" ADD COLUMN "cnic" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "cnic" TEXT;
