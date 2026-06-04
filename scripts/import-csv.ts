/**
 * CSV Import Script
 * 
 * Reads client_export.csv and animal_export.csv from the project root
 * and imports them into the PostgreSQL database via Prisma.
 * 
 * Usage: npx tsx scripts/import-csv.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CLINIC_ID = "c1-demo-clinic";

async function main() {
  console.log("🏥 CSV Import — Hospital Veterinário Gato Escondido");
  console.log("═".repeat(60));

  // ─── 1. Ensure clinic exists ────────────────────────────────────────
  await prisma.clinic.upsert({
    where: { id: CLINIC_ID },
    update: {},
    create: {
      id: CLINIC_ID,
      name: "Hospital Veterinário Gato Escondido",
      address: "Avenida da Liberdade 123, Palmela",
      vatNumber: "500987654",
      phone: "210 000 000",
      email: "geral@gatoescondido.pt",
    },
  });
  console.log("✅ Clínica verificada\n");

  // ─── 2. Import Clients ─────────────────────────────────────────────
  const clientPath = path.join(process.cwd(), "client_export.csv");
  if (!fs.existsSync(clientPath)) {
    console.error("❌ client_export.csv não encontrado na raiz do projeto");
    return;
  }

  console.log("📋 A importar clientes...");
  const clientRaw = fs.readFileSync(clientPath, "latin1");
  const clientRecords = parseMultiLineCSV(clientRaw, 15);
  
  const clientIdMap = new Map<string, string>();
  let clientsImported = 0;
  let clientsSkipped = 0;
  let clientsErrors = 0;

  for (const row of clientRecords) {
    const csvId = row[0]?.trim();
    const name = row[2]?.trim();
    
    if (!csvId || !name || csvId === "ID" || name.startsWith("*")) {
      clientsSkipped++;
      continue;
    }

    const vatNumber = row[1]?.trim() || null;
    const email = row[4]?.trim() || null;
    const morada = row[6]?.trim() || "";
    const codigoPostal = row[7]?.trim() || "";
    const cidade = row[8]?.trim() || "";
    const address = [morada, codigoPostal, cidade].filter(Boolean).join(", ") || null;
    const telefone = row[10]?.trim() || null;
    const telemovel = row[11]?.trim() || null;
    const phone = telemovel || telefone || null;
    const notes = row[14]?.trim() || null;

    try {
      const dbId = `csv-${csvId}`;
      
      const owner = await prisma.owner.upsert({
        where: { id: dbId },
        update: {
          name,
          vatNumber: vatNumber || undefined,
          phone: phone || undefined,
          address: address || undefined,
          notes: notes || undefined,
        },
        create: {
          id: dbId,
          name,
          email: email && email.includes("@") ? email : null,
          vatNumber,
          phone,
          address,
          notes,
          clinicId: CLINIC_ID,
        },
      });

      clientIdMap.set(csvId, owner.id);
      clientsImported++;

      if (clientsImported % 200 === 0) {
        process.stdout.write(`   ${clientsImported} clientes importados...\r`);
      }
    } catch (error: any) {
      if (error?.code === "P2002") {
        // Duplicate email — try to find existing and map
        try {
          const existing = await prisma.owner.findFirst({
            where: { OR: [{ id: `csv-${csvId}` }] },
          });
          if (existing) {
            clientIdMap.set(csvId, existing.id);
            clientsSkipped++;
          } else {
            // Create without email
            const owner = await prisma.owner.create({
              data: {
                id: `csv-${csvId}`,
                name,
                vatNumber,
                phone,
                address,
                notes,
                clinicId: CLINIC_ID,
              },
            });
            clientIdMap.set(csvId, owner.id);
            clientsImported++;
          }
        } catch {
          clientsErrors++;
        }
      } else {
        clientsErrors++;
      }
    }
  }
  
  console.log(`\n   ✅ Importados: ${clientsImported}`);
  console.log(`   ⏭️  Saltados:   ${clientsSkipped}`);
  console.log(`   ❌ Erros:      ${clientsErrors}`);
  console.log(`   🔑 IDs mapeados: ${clientIdMap.size}\n`);

  // ─── 3. Import Animals ─────────────────────────────────────────────
  const animalPath = path.join(process.cwd(), "animal_export.csv");
  if (!fs.existsSync(animalPath)) {
    console.error("❌ animal_export.csv não encontrado na raiz do projeto");
    return;
  }

  console.log("🐾 A importar animais...");
  const animalRaw = fs.readFileSync(animalPath, "latin1");
  const animalRecords = parseMultiLineCSV(animalRaw, 12);
  
  let animalsImported = 0;
  let animalsSkipped = 0;
  let animalsErrors = 0;

  for (const row of animalRecords) {
    const animalNumber = row[0]?.trim();
    const chip = row[1]?.trim() || null;
    const name = row[2]?.trim();
    const clientCsvId = row[3]?.trim();
    const speciesRaw = row[5]?.trim();
    const breed = row[6]?.trim() || null;
    const genderRaw = row[7]?.trim();
    const birthDateStr = row[9]?.trim();
    const deathDateStr = row[10]?.trim();
    const observations = row[11]?.trim() || null;

    // Skip header
    if (!animalNumber || !name || animalNumber === "Número" || animalNumber === "N\u00famero") {
      animalsSkipped++;
      continue;
    }

    // Skip deceased animals
    if (deathDateStr && deathDateStr.length > 0) {
      animalsSkipped++;
      continue;
    }

    // Must have a valid owner
    const ownerId = clientIdMap.get(clientCsvId);
    if (!ownerId) {
      animalsSkipped++;
      continue;
    }

    const species = normalizeSpecies(speciesRaw);
    const gender = normalizeGender(genderRaw);

    let birthDate: Date | null = null;
    if (birthDateStr && /^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
      const d = new Date(birthDateStr);
      if (!isNaN(d.getTime())) birthDate = d;
    }

    // Validate chip: only use if non-empty and reasonable
    const validChip = chip && chip.length >= 10 ? chip : null;

    try {
      const dbId = `csv-animal-${animalNumber}`;
      
      await prisma.patient.upsert({
        where: { id: dbId },
        update: {
          name,
          species,
          breed: breed !== "-Indefinida" && breed !== "Indefinida" ? breed : null,
          gender,
          birthDate,
          allergies: observations,
        },
        create: {
          id: dbId,
          name,
          species,
          breed: breed !== "-Indefinida" && breed !== "Indefinida" ? breed : null,
          gender,
          birthDate,
          microchip: validChip,
          allergies: observations,
          ownerId,
          clinicId: CLINIC_ID,
        },
      });

      animalsImported++;

      if (animalsImported % 500 === 0) {
        process.stdout.write(`   ${animalsImported} animais importados...\r`);
      }
    } catch (error: any) {
      if (error?.code === "P2002") {
        // Duplicate microchip — try without it
        try {
          const dbId = `csv-animal-${animalNumber}`;
          await prisma.patient.upsert({
            where: { id: dbId },
            update: {
              name,
              species,
              breed: breed !== "-Indefinida" && breed !== "Indefinida" ? breed : null,
              gender,
              birthDate,
              allergies: observations,
            },
            create: {
              id: dbId,
              name,
              species,
              breed: breed !== "-Indefinida" && breed !== "Indefinida" ? breed : null,
              gender,
              birthDate,
              allergies: observations,
              ownerId,
              clinicId: CLINIC_ID,
            },
          });
          animalsImported++;
        } catch {
          animalsErrors++;
        }
      } else {
        animalsErrors++;
      }
    }
  }

  console.log(`\n   ✅ Importados: ${animalsImported}`);
  console.log(`   ⏭️  Saltados:   ${animalsSkipped}`);
  console.log(`   ❌ Erros:      ${animalsErrors}`);
  
  console.log("\n" + "═".repeat(60));
  console.log(`🎉 Importação concluída!`);
  console.log(`   Total Clientes: ${clientsImported}`);
  console.log(`   Total Animais:  ${animalsImported}`);
}

function parseMultiLineCSV(raw: string, expectedColumns: number): string[][] {
  const lines = raw.split(/\r?\n/);
  const records: string[][] = [];
  let currentRecord: string[] = [];
  
  for (const line of lines) {
    const fields = line.split(";");
    
    // A new record has at least (expectedColumns - 3) semicolons
    if (fields.length >= expectedColumns - 3) {
      if (currentRecord.length > 0) {
        records.push(currentRecord);
      }
      currentRecord = fields;
    } else if (currentRecord.length > 0) {
      // Continuation of previous record (multi-line observation field)
      const lastIdx = currentRecord.length - 1;
      currentRecord[lastIdx] = (currentRecord[lastIdx] || "") + "\n" + line;
    }
  }
  
  if (currentRecord.length > 0) {
    records.push(currentRecord);
  }
  
  return records;
}

function normalizeSpecies(raw: string | undefined): string {
  if (!raw) return "Outro";
  const lower = raw.toLowerCase();
  if (lower.includes("can") || lower.includes("cão")) return "Cão";
  if (lower.includes("fel") || lower.includes("gato")) return "Gato";
  if (lower.includes("ave") || lower.includes("pássaro") || lower.includes("psit")) return "Ave";
  if (lower.includes("lago") || lower.includes("coelho")) return "Coelho";
  if (lower.includes("rept") || lower.includes("tartaruga")) return "Réptil";
  if (lower.includes("roedor") || lower.includes("hamster") || lower.includes("porquinho")) return "Roedor";
  if (lower.includes("equ")) return "Equídeo";
  return raw;
}

function normalizeGender(raw: string | undefined): string {
  if (!raw) return "Desconhecido";
  const lower = raw.toLowerCase().trim();
  if (lower === "m" || lower.startsWith("masc")) return "M";
  if (lower === "f" || lower.startsWith("fem")) return "F";
  if (lower === "mc" || lower.includes("castrado")) return "MC";
  if (lower === "fc" || lower.includes("esteriliz")) return "FC";
  return raw;
}

main()
  .catch((e) => {
    console.error("💥 Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
