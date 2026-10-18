-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "bankName" TEXT,
ADD COLUMN "bankBranch" TEXT,
ADD COLUMN "bankAccountTitle" TEXT,
ADD COLUMN "bankAccountNumber" TEXT,
ADD COLUMN "bankIban" TEXT,
ADD COLUMN "paymentInstructions" TEXT;

-- AlterTable
ALTER TABLE "Challan" ADD COLUMN "feeMonth" INTEGER,
ADD COLUMN "feeYear" INTEGER,
ADD COLUMN "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
