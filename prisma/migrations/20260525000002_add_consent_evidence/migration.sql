-- Add userAgent and policyUrl columns to PrivacyConsent
ALTER TABLE "PrivacyConsent" ADD COLUMN IF NOT EXISTS "policyUrl" TEXT;
ALTER TABLE "PrivacyConsent" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
