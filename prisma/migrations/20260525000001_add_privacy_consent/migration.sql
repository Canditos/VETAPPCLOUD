-- CreateTable: PrivacyConsent
CREATE TABLE IF NOT EXISTS "PrivacyConsent" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "ip" TEXT,
    "method" TEXT NOT NULL DEFAULT 'portal',
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyConsent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrivacyConsent_ownerId_fkey" FOREIGN KEY ("ownerId")
        REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivacyConsent_clinicId_fkey" FOREIGN KEY ("clinicId")
        REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PrivacyConsent_clinicId_idx" ON "PrivacyConsent"("clinicId");
CREATE INDEX IF NOT EXISTS "PrivacyConsent_ownerId_idx" ON "PrivacyConsent"("ownerId");
CREATE INDEX IF NOT EXISTS "PrivacyConsent_ownerId_accepted_idx" ON "PrivacyConsent"("ownerId", "accepted");
