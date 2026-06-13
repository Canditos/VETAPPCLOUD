-- Add minStock column to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 5;
