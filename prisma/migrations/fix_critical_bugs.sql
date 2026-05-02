-- Migration: fix_critical_bugs
-- Aplica as correções dos 4 bugs críticos identificados na análise

-- 1. Renomear campo password -> passwordHash na tabela User
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";

-- 2. Adicionar clinicId ao modelo Owner
ALTER TABLE "Owner" ADD COLUMN "clinicId" TEXT;

-- Se já tens dados, podes preencher com uma clínica default:
-- UPDATE "Owner" SET "clinicId" = '<id-da-clinica>' WHERE "clinicId" IS NULL;

-- Tornar o campo obrigatório (só após preencher dados existentes)
ALTER TABLE "Owner" ALTER COLUMN "clinicId" SET NOT NULL;

-- Adicionar foreign key para Clinic
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remover o unique global de email e criar unique composto por (clinicId, email)
ALTER TABLE "Owner" DROP CONSTRAINT IF EXISTS "Owner_email_key";
CREATE UNIQUE INDEX "Owner_clinicId_email_key" ON "Owner"("clinicId", "email") 
  WHERE "email" IS NOT NULL;

-- 3. Adicionar campo externalId ao Invoice (jasminInvoiceId já existe)
ALTER TABLE "Invoice" ADD COLUMN "externalId" TEXT UNIQUE;
