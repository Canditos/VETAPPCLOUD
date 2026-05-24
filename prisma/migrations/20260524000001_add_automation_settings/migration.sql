-- CreateTable: AutomationSettings
CREATE TABLE IF NOT EXISTS "AutomationSettings" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN DEFAULT true NOT NULL,
    "smsEnabled" BOOLEAN DEFAULT false NOT NULL,
    "reminder24h" BOOLEAN DEFAULT true NOT NULL,
    "vaccineAlert" BOOLEAN DEFAULT true NOT NULL,
    "invoiceEmail" BOOLEAN DEFAULT true NOT NULL,
    "smsMarketing" BOOLEAN DEFAULT false NOT NULL,
    "rut240Ip" TEXT,
    "rut240Port" INTEGER DEFAULT 80 NOT NULL,
    "rut240User" TEXT,
    "rut240Password" TEXT,
    "rut240Enabled" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AutomationSettings_clinicId_key" UNIQUE ("clinicId"),
    CONSTRAINT "AutomationSettings_clinicId_fkey" FOREIGN KEY ("clinicId")
        REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: SmsLog
CREATE TABLE IF NOT EXISTS "SmsLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SmsLog_clinicId_fkey" FOREIGN KEY ("clinicId")
        REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SmsLog_clinicId_idx" ON "SmsLog"("clinicId");
CREATE INDEX IF NOT EXISTS "SmsLog_clinicId_sentAt_idx" ON "SmsLog"("clinicId", "sentAt" DESC);
