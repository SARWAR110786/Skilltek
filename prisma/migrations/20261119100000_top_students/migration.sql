-- CreateTable
CREATE TABLE "TopStudentsPublication" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "students" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopStudentsPublication_pkey" PRIMARY KEY ("id")
);

-- Same protection as every other table (no Supabase API access).
ALTER TABLE "TopStudentsPublication" ENABLE ROW LEVEL SECURITY;
