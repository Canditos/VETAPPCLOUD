-- Align Vaccination/Deworming with multi-tenant isolation (clinicId).
-- Idempotent: safe to run even if the column was already added manually.

ALTER TABLE "Vaccination" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Vaccination" v SET "clinicId" = p."clinicId" FROM "Patient" p WHERE v."patientId" = p."id" AND v."clinicId" IS NULL;
ALTER TABLE "Vaccination" ALTER COLUMN "clinicId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Vaccination_clinicId_idx" ON "Vaccination"("clinicId");

ALTER TABLE "Deworming" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;
UPDATE "Deworming" d SET "clinicId" = p."clinicId" FROM "Patient" p WHERE d."patientId" = p."id" AND d."clinicId" IS NULL;
ALTER TABLE "Deworming" ALTER COLUMN "clinicId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "Deworming_clinicId_idx" ON "Deworming"("clinicId");
