const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // 1. Create Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: "Clínica Veterinária Gato Escondido",
      address: "Rua do Bem-Estar, Palmela",
      vatNumber: "500123456",
    },
  });

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Dr. Marco António",
      email: "marco@clinicavet.pt",
      passwordHash,
      role: "ADMIN",
      clinicId: clinic.id,
    },
  });

  // 3. Create Veterinarian
  const vet = await prisma.user.create({
    data: {
      name: "Dra. Sara Lima",
      email: "sara@clinicavet.pt",
      passwordHash,
      role: "VETERINARIAN",
      clinicId: clinic.id,
    },
  });

  // 4. Create Owner & Patient
  const owner = await prisma.owner.create({
    data: {
      name: "João Silva",
      email: "joao.silva@exemplo.pt",
      phone: "912345678",
      clinicId: clinic.id,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      name: "Tobias",
      species: "Gato",
      breed: "Europeu Comum",
      birthDate: new Date("2020-05-15"),
      clinicId: clinic.id,
      ownerId: owner.id,
    },
  });

  // 5. Create Products
  await prisma.product.createMany({
    data: [
      { name: "Consulta Geral", price: 35.0, stockQuantity: 999, clinicId: clinic.id },
      { name: "Vacina Raiva", price: 15.0, stockQuantity: 50, clinicId: clinic.id },
      { name: "Desparasitante", price: 8.5, stockQuantity: 24, clinicId: clinic.id },
    ],
  });

  // 6. Create Appointments
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientId: patient.id,
        veterinarianId: vet.id,
        startTime: today,
        endTime: new Date(today.getTime() + 60 * 60 * 1000),
        type: "Vacinação",
        status: "SCHEDULED",
      },
      {
        clinicId: clinic.id,
        patientId: patient.id,
        veterinarianId: vet.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        type: "Check-up",
        status: "SCHEDULED",
      }
    ]
  });

  console.log("Seed finished successfully!");
  console.log(`Admin Login: marco@clinicavet.pt / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
