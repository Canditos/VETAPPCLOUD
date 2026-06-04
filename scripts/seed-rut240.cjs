/**
 * Seed RUT240 credentials into AutomationSettings.
 * Run: node scripts/seed-rut240.cjs
 * Or via Docker: cat scripts/seed-rut240.cjs | docker exec -i vet-app node -e "$(cat)"
 */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) { console.error("No clinic found"); process.exit(1); }

  await prisma.automationSettings.upsert({
    where: { clinicId: clinic.id },
    update: {
      rut240Ip: "192.168.1.1",
      rut240Port: 80,
      rut240User: "canditos",
      rut240Password: "Canditos01",
      rut240Enabled: true,
      smsEnabled: true,
    },
    create: {
      clinicId: clinic.id,
      rut240Ip: "192.168.1.1",
      rut240Port: 80,
      rut240User: "canditos",
      rut240Password: "Canditos01",
      rut240Enabled: true,
      smsEnabled: true,
    },
  });

  console.log("RUT240 credentials saved for clinic:", clinic.name);
  const settings = await prisma.automationSettings.findUnique({ where: { clinicId: clinic.id } });
  console.log("Settings:", JSON.stringify(settings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
