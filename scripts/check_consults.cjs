const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const owner = await prisma.owner.findFirst({ where: { email: "ferreira.elsa@hotmail.com" } });
  if (!owner) { console.log("Owner not found"); return; }
  console.log("Owner:", owner.name, "ID:", owner.id);
  const patients = await prisma.patient.findMany({
    where: { ownerId: owner.id },
    include: { _count: { select: { consultations: true } } }
  });
  for (const p of patients) {
    console.log(p.name, "(", p.species, "):", p._count.consultations, "consultas");
  }
  const total = await prisma.consultation.count();
  console.log("Total consultations in DB:", total);
  const orphan = await prisma.consultation.count({ where: { patientId: null } });
  console.log("Orphan consultations (null patientId):", orphan);
  const emptyPatientId = await prisma.consultation.count({ where: { patientId: "" } });
  console.log("Empty string patientId:", emptyPatientId);
  // Check if any consultations exist for this owner's patients
  const patientIds = patients.map(p => p.id);
  const consultsForOwner = await prisma.consultation.count({ where: { patientId: { in: patientIds } } });
  console.log("Consultations for Elsa's patients:", consultsForOwner);
}

main().catch(console.error).finally(() => prisma.$disconnect());
