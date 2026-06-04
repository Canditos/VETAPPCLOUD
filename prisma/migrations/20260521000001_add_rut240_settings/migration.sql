-- AlterTable: Add RUT240 gateway fields to AutomationSettings
ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "rut240Ip" TEXT;
ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "rut240Port" INTEGER DEFAULT 80 NOT NULL;
ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "rut240User" TEXT;
ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "rut240Password" TEXT;
ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "rut240Enabled" BOOLEAN DEFAULT false NOT NULL;
