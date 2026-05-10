-- Migration: add_portal_tables
-- Portal do Tutor — tabelas de autenticação por token e pedidos de marcação

CREATE TABLE "OwnerPortalToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "token"     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"   TEXT NOT NULL,
  "clinicId"  TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "lastUsed"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OwnerPortalToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OwnerPortalToken_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OwnerPortalToken_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OwnerPortalToken_token_key" ON "OwnerPortalToken"("token");
CREATE INDEX "OwnerPortalToken_token_idx" ON "OwnerPortalToken"("token");
CREATE INDEX "OwnerPortalToken_ownerId_idx" ON "OwnerPortalToken"("ownerId");

CREATE TABLE "PortalAppointmentRequest" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ownerId"   TEXT NOT NULL,
  "clinicId"  TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "reason"    TEXT NOT NULL,
  "preferred" TEXT,
  "status"    TEXT NOT NULL DEFAULT 'PENDING',
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortalAppointmentRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PortalAppointmentRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PortalAppointmentRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PortalAppointmentRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PortalAppointmentRequest_clinicId_status_idx" ON "PortalAppointmentRequest"("clinicId", "status");
