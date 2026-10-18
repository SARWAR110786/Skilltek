-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "qualification",
DROP COLUMN "specialization";

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
