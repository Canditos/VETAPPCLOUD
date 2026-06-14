-- AlterTable
ALTER TABLE "Owner" ADD COLUMN "lifetimeValue" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "preferredVeterinarianId" TEXT;
