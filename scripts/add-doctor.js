const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function addDoctor(name, email, password, licenseNumber = null) {
  try {
    // 1. Get the clinic (defaults to the first one)
    const clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      console.error("❌ Erro: Nenhuma clínica encontrada na base de dados. Por favor, corre o seed primeiro.");
      return;
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        licenseNumber,
        role: "VETERINARIAN",
        clinicId: clinic.id,
      },
    });

    console.log("--------------------------------------------------");
    console.log(`✅ Médico adicionado com sucesso: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🏥 Clínica: ${clinic.name}`);
    console.log(`🔑 Role: ${user.role}`);
    if (licenseNumber) console.log(`📜 Cédula: ${licenseNumber}`);
    console.log("--------------------------------------------------");
  } catch (error) {
    if (error.code === 'P2002') {
      console.error(`❌ Erro: O email ${email} já está em uso.`);
    } else {
      console.error("❌ Erro ao adicionar médico:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// CLI Handling
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("\n🚀 Script de Adição de Médicos (VetConnect)");
  console.log("Uso: node scripts/add-doctor.js <nome> <email> <password> [numero_cedula]");
  console.log('\nExemplo: node scripts/add-doctor.js "Dr. João Silva" "joao@clinicavet.pt" "vet123" "CP5566"\n');
} else {
  addDoctor(args[0], args[1], args[2], args[3] || null);
}
