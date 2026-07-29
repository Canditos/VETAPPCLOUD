-- AlterTable
ALTER TABLE "Owner" ADD COLUMN "rxClientId" VARCHAR(20);
CREATE UNIQUE INDEX "Owner_rxClientId_key" ON "Owner"("rxClientId");
