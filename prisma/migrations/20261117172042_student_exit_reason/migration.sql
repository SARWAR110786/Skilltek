-- CreateEnum
CREATE TYPE "StudentExitReason" AS ENUM ('DROPOUT', 'PASSOUT');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "exitReason" "StudentExitReason";
