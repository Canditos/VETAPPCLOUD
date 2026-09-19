-- Migração manual para campos pendentes
-- Aplicar se o build local falhar com P2022

-- 1. Patient.valueScore
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "valueScore" INTEGER DEFAULT 0;

-- 2. Appointment.upsellOffered, expectedRevenue, followUpScheduled, treatmentCompliance
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "upsellOffered" BOOLEAN DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "expectedRevenue" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "followUpScheduled" BOOLEAN DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "treatmentCompliance" INTEGER DEFAULT 0;

-- 3. Product.minStock (já aplicado)
-- ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minStock" INTEGER DEFAULT 5;
