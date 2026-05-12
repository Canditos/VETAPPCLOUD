-- Migration: add_notifications_table
-- Sistema de notificações internas para a clínica

CREATE TABLE "Notification" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clinicId"  TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "read"      BOOLEAN NOT NULL DEFAULT false,
  "link"      TEXT,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_clinicId_fkey" FOREIGN KEY ("clinicId")
    REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Notification_clinicId_read_idx" ON "Notification"("clinicId", "read");
CREATE INDEX "Notification_clinicId_createdAt_idx" ON "Notification"("clinicId", "createdAt" DESC);
