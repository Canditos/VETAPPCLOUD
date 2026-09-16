-- Missing indexes on frequently-filtered columns.
CREATE INDEX IF NOT EXISTS "Payment_clinicId_idx" ON "Payment"("clinicId");
CREATE INDEX IF NOT EXISTS "Payment_ownerId_idx" ON "Payment"("ownerId");
CREATE INDEX IF NOT EXISTS "Payment_paidAt_idx" ON "Payment"("paidAt");
CREATE INDEX IF NOT EXISTS "Budget_clinicId_idx" ON "Budget"("clinicId");
CREATE INDEX IF NOT EXISTS "Budget_ownerId_idx" ON "Budget"("ownerId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "Attachment_consultationId_idx" ON "Attachment"("consultationId");
CREATE INDEX IF NOT EXISTS "HospitalizationTask_completedById_idx" ON "HospitalizationTask"("completedById");
CREATE INDEX IF NOT EXISTS "Prescription_clinicId_idx" ON "Prescription"("clinicId");
CREATE INDEX IF NOT EXISTS "Prescription_patientId_idx" ON "Prescription"("patientId");
CREATE INDEX IF NOT EXISTS "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_clinicId_idx" ON "Subscription"("clinicId");
CREATE INDEX IF NOT EXISTS "Subscription_ownerId_idx" ON "Subscription"("ownerId");
CREATE INDEX IF NOT EXISTS "Subscription_patientId_idx" ON "Subscription"("patientId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "HealthPlan_clinicId_idx" ON "HealthPlan"("clinicId");
