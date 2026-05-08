const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const patientCount = await prisma.patient.count();
    const userCount = await prisma.user.count();
    console.log(`Patients: ${patientCount}`);
    console.log(`Users: ${userCount}`);
  } catch (e) {
    console.error("DB Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
