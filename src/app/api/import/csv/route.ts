import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow up to 5 mins for large imports

/**
 * CSV Import route - reads client_export.csv and animal_export.csv
 * from the project root and imports them into the database.
 * 
 * GET /api/import/csv
 */
export async function GET() {
  const clinicId = "c1-demo-clinic";
  const results = { 
    clients: { imported: 0, skipped: 0, errors: 0 }, 
    animals: { imported: 0, skipped: 0, errors: 0 },
    details: [] as string[]
  };

  // ─── 1. Ensure clinic exists ────────────────────────────────────────
  await prisma.clinic.upsert({
    where: { id: clinicId },
    update: {},
    create: {
      id: clinicId,
      name: "Hospital Veterinário Gato Escondido",
      address: "Avenida da Liberdade 123, Palmela",
      vatNumber: "500987654",
      phone: "210 000 000",
      email: "geral@gatoescondido.pt",
    },
  });

  // ─── 2. Parse Client CSV ───────────────────────────────────────────
  // Header: ID;Nº Contribuinte;Nome;Empresa;Email;Grupo;Morada;Código Postal;Cidade;País;Telefone;Telemóvel;Fax;Animal;Descrição
  const clientPath = path.join(process.cwd(), "client_export.csv");
  
  if (!fs.existsSync(clientPath)) {
    return NextResponse.json({ error: "client_export.csv not found in project root" }, { status: 404 });
  }

  const clientRaw = fs.readFileSync(clientPath, "latin1");
  const clientRecords = parseMultiLineCSV(clientRaw, 15); // 15 columns
  
  // Map: CSV ID -> database Owner ID
  const clientIdMap = new Map<string, string>();

  for (const row of clientRecords) {
    const csvId = row[0]?.trim();
    const name = row[2]?.trim();
    
    // Skip header, empty names, or system entries
    if (!csvId || !name || csvId === "ID" || name.startsWith("*")) {
      results.clients.skipped++;
      continue;
    }

    const vatNumber = row[1]?.trim() || null;
    const email = row[4]?.trim() || null;
    const address = [row[6]?.trim(), row[7]?.trim(), row[8]?.trim()]
      .filter(Boolean)
      .join(", ") || null;
    const phone = row[10]?.trim() || row[11]?.trim() || null;
    const notes = row[14]?.trim() || null;

    try {
      // Use csvId as the database ID for stable references
      const dbId = `csv-${csvId}`;
      
      const owner = await prisma.owner.upsert({
        where: { id: dbId },
        update: {
          name,
          vatNumber,
          email: email || undefined,
          phone,
          address,
          notes,
        },
        create: {
          id: dbId,
          name,
          email,
          vatNumber,
          phone,
          address,
          notes,
          clinicId,
        },
      });

      clientIdMap.set(csvId, owner.id);
      results.clients.imported++;
    } catch (error: any) {
      // Handle unique constraint on email — skip duplicates
      if (error?.code === "P2002" && email) {
        // Try to find existing owner by email and map the ID
        try {
          const existing = await prisma.owner.findFirst({
            where: { email, clinicId },
          });
          if (existing) {
            clientIdMap.set(csvId, existing.id);
            results.clients.skipped++;
          }
        } catch {
          results.clients.errors++;
        }
      } else {
        results.clients.errors++;
        if (results.details.length < 20) {
          results.details.push(`Client error [${csvId}] ${name}: ${error?.message?.substring(0, 100)}`);
        }
      }
    }
  }

  // ─── 3. Parse Animal CSV ───────────────────────────────────────────
  // Header: Número;Chip;Nome;ID;Cliente;Espécie;Raça;Sexo;Cor;Data Nascimento;Data Óbito;Observações
  const animalPath = path.join(process.cwd(), "animal_export.csv");
  
  if (!fs.existsSync(animalPath)) {
    return NextResponse.json({ 
      ...results, 
      warning: "animal_export.csv not found — only clients were imported" 
    });
  }

  const animalRaw = fs.readFileSync(animalPath, "latin1");
  const animalRecords = parseMultiLineCSV(animalRaw, 12); // 12 columns
  
  for (const row of animalRecords) {
    const animalNumber = row[0]?.trim();
    const chip = row[1]?.trim() || null;
    const name = row[2]?.trim();
    const clientCsvId = row[3]?.trim(); // This is the client CSV ID
    const species = normalizeSpecies(row[5]?.trim());
    const breed = row[6]?.trim() || null;
    const gender = normalizeGender(row[7]?.trim());
    const birthDateStr = row[9]?.trim();
    const deathDateStr = row[10]?.trim();
    const observations = row[11]?.trim() || null;

    // Skip header or empty
    if (!animalNumber || !name || animalNumber === "Número" || animalNumber === "N\u00famero") {
      results.animals.skipped++;
      continue;
    }

    // Skip deceased animals
    if (deathDateStr) {
      results.animals.skipped++;
      continue;
    }

    // Must have a valid owner reference
    const ownerId = clientIdMap.get(clientCsvId);
    if (!ownerId) {
      results.animals.skipped++;
      continue;
    }

    // Parse birth date
    let birthDate: Date | null = null;
    if (birthDateStr && /^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
      birthDate = new Date(birthDateStr);
      if (isNaN(birthDate.getTime())) birthDate = null;
    }

    try {
      const dbId = `csv-animal-${animalNumber}`;
      
      await prisma.patient.upsert({
        where: { id: dbId },
        update: {
          name,
          species,
          breed,
          gender,
          birthDate,
          microchip: chip || undefined,
          allergies: observations,
        },
        create: {
          id: dbId,
          name,
          species,
          breed,
          gender,
          birthDate,
          microchip: chip || undefined,
          allergies: observations,
          ownerId,
          clinicId,
        },
      });

      results.animals.imported++;
    } catch (error: any) {
      // Skip duplicate microchip errors
      if (error?.code === "P2002") {
        results.animals.skipped++;
      } else {
        results.animals.errors++;
        if (results.details.length < 30) {
          results.details.push(`Animal error [${animalNumber}] ${name}: ${error?.message?.substring(0, 100)}`);
        }
      }
    }
  }

  return NextResponse.json({
    message: "Import complete!",
    ...results,
  });
}

/**
 * Parse a semicolon-delimited CSV that may have multi-line fields.
 * Returns an array of string arrays, each representing one logical record.
 */
function parseMultiLineCSV(raw: string, expectedColumns: number): string[][] {
  const lines = raw.split(/\r?\n/);
  const records: string[][] = [];
  let currentRecord: string[] = [];
  
  for (const line of lines) {
    const fields = line.split(";");
    
    if (fields.length >= expectedColumns - 2) {
      // This looks like a new record (has enough semicolons)
      if (currentRecord.length > 0) {
        records.push(currentRecord);
      }
      currentRecord = fields;
    } else if (currentRecord.length > 0) {
      // Continuation of previous record's last field (multi-line observation)
      const lastIdx = currentRecord.length - 1;
      currentRecord[lastIdx] = (currentRecord[lastIdx] || "") + "\n" + line;
    }
  }
  
  // Don't forget the last record
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
