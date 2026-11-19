-- AlterTable: optional start and end dates for a course.
ALTER TABLE "Course" ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3);
