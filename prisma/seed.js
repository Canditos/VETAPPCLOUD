const { PrismaClient } = require("@prisma/client");
try {
  require("dotenv").config();
} catch (e) {
  // Ignorar erro em produção
}
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({});

async function main() {
  console.log("Starting production-grade seed...");

  // 1. Create Clinic
  const CLINIC_NAME = process.env.CLINIC_NAME || "Hospital Veterinário Gato Escondido";
  const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS || "Avenida da Liberdade 123, Palmela";
  const CLINIC_VAT = process.env.CLINIC_VAT || "500987654";
  const CLINIC_PHONE = process.env.CLINIC_PHONE || "210 000 000";
  const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "geral@gatoescondido.pt";

  const clinic = await prisma.clinic.upsert({
    where: { id: 'c1-demo-clinic' },
    update: {
      name: CLINIC_NAME,
      address: CLINIC_ADDRESS,
      vatNumber: CLINIC_VAT,
      phone: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
    create: {
      id: 'c1-demo-clinic',
      name: CLINIC_NAME,
      address: CLINIC_ADDRESS,
      vatNumber: CLINIC_VAT,
      phone: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
  });

  // 2. Create Users
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "marco@clinicavet.pt";
  const ADMIN_NAME = process.env.ADMIN_NAME || "Dr. Marco António";
  const passwordHash = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      clinicId: clinic.id,
    },
  });

  const vet = await prisma.user.upsert({
    where: { email: "sara@clinicavet.pt" },
    update: {},
    create: {
      name: "Dra. Sara Lima",
      email: "sara@clinicavet.pt",
      passwordHash,
      role: "VETERINARIAN",
      clinicId: clinic.id,
    },
  });

  const vet2 = await prisma.user.upsert({
    where: { email: "ricardo@clinicavet.pt" },
    update: {},
    create: {
      name: "Dr. Ricardo Santos",
      email: "ricardo@clinicavet.pt",
      passwordHash,
      role: "VETERINARIAN",
      clinicId: clinic.id,
    },
  });

  // 3. Create Customers (Hub 360º)
  const customer1 = await prisma.owner.create({
    data: {
      name: "Ricardo Fonseca",
      email: "ricardo.fonseca@email.com",
      phone: "910 000 001",
      vatNumber: "234567890",
      address: "Rua dos Animais, 45, Setúbal",
      notes: "Cliente habitual, prefere contacto via WhatsApp.",
      clinicId: clinic.id,
    }
  });

  const customer2 = await prisma.owner.create({
    data: {
      name: "Ana Martins",
      email: "ana.martins@email.com",
      phone: "960 000 002",
      vatNumber: "123123123",
      address: "Urbanização das Flores, Palmela",
      notes: "Cuidado com o cão Rex, é agressivo com outros animais.",
      clinicId: clinic.id,
    }
  });

  // 4. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      name: "Bolinha",
      species: "Gato",
      breed: "Siamês",
      gender: "F",
      weight: 4.2,
      birthDate: new Date("2021-02-10"),
      microchip: "900123456789012",
      allergies: "Alergia a picada de pulga",
      ownerId: customer1.id,
      clinicId: clinic.id,
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: "Rex",
      species: "Cão",
      breed: "Pastor Alemão",
      gender: "M",
      weight: 32.5,
      birthDate: new Date("2019-11-20"),
      microchip: "900123456789013",
      ownerId: customer2.id,
      clinicId: clinic.id,
    }
  });

  // 5. Products & Inventory
  const p1 = await prisma.product.create({
    data: {
      name: "Consulta Geral",
      price: 45.0,
      vatRate: 23,
      stockQuantity: 999,
      category: "Serviços",
      clinicId: clinic.id,
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Vacina Nobivac DHPPi",
      price: 25.0,
      vatRate: 6,
      stockQuantity: 42,
      batchNumber: "BATCH-2024-X1",
      expiryDate: new Date("2025-12-31"),
      category: "Vacinas",
      clinicId: clinic.id,
    }
  });

  // 6. Invoices & Payments (The Hub Logic)
  // Invoice 1: Fully Paid
  const inv1 = await prisma.invoice.create({
    data: {
      ownerId: customer1.id,
      clinicId: clinic.id,
      total: 70.0,
      status: "PAID",
      jasminInvoiceId: "FT 2026/1",
      items: {
        create: [
          { description: "Consulta Geral", quantity: 1, price: 45.0, vatRate: 23 },
          { description: "Vacina Nobivac", quantity: 1, price: 25.0, vatRate: 6 }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      ownerId: customer1.id,
      clinicId: clinic.id,
      invoiceId: inv1.id,
      amount: 70.0,
      method: "MBWAY",
      paidAt: new Date(),
    }
  });

  // Invoice 2: Partially Paid (Debt)
  const inv2 = await prisma.invoice.create({
    data: {
      ownerId: customer2.id,
      clinicId: clinic.id,
      total: 150.0,
      status: "ISSUED",
      jasminInvoiceId: "FT 2026/2",
      items: {
        create: [
          { description: "Cirurgia Esterilização", quantity: 1, price: 150.0, vatRate: 23 }
        ]
      }
    }
  });

  await prisma.payment.create({
    data: {
      ownerId: customer2.id,
      clinicId: clinic.id,
      invoiceId: inv2.id,
      amount: 50.0,
      method: "CASH",
      paidAt: new Date(),
    }
  });

  // 7. Budgets
  await prisma.budget.create({
    data: {
      ownerId: customer1.id,
      patientId: patient1.id,
      clinicId: clinic.id,
      status: "ACCEPTED",
      totalAmount: 250.0,
      notes: "Plano de saúde anual proposto.",
      items: {
        create: [
          { description: "Check-up Completo", quantity: 1, price: 100.0 },
          { description: "Análises Sangue", quantity: 1, price: 150.0 }
        ]
      }
    }
  });

  await prisma.budget.create({
    data: {
      ownerId: customer2.id,
      clinicId: clinic.id,
      status: "DRAFT",
      totalAmount: 45.0,
      items: {
        create: [
          { description: "Limpeza de Dentes", quantity: 1, price: 45.0 }
        ]
      }
    }
  });

  // 8. Hospitalizations
  const hosp1 = await prisma.hospitalization.create({
    data: {
      patientId: patient1.id,
      boxNumber: "BOX 01",
      reason: "Pós-operatório de esterilização",
      status: "ADMITTED",
      admissionDate: new Date(),
      admissionById: admin.id,
      clinicId: clinic.id,
      tasks: {
        create: [
          { 
            description: "Medição de Temperatura", 
            scheduledTime: new Date(new Date().setHours(new Date().getHours() + 2)),
            status: "PENDING"
          },
          { 
            description: "Administração de Antibiótico", 
            scheduledTime: new Date(new Date().setHours(new Date().getHours() - 1)),
            status: "COMPLETED",
            completedById: admin.id,
            completedAt: new Date()
          },
          { 
            description: "Limpeza da Box", 
            scheduledTime: new Date(new Date().setHours(new Date().getHours() + 4)),
            status: "PENDING"
          }
        ]
      }
    }
  });

  const hosp2 = await prisma.hospitalization.create({
    data: {
      patientId: patient2.id,
      boxNumber: "BOX 05",
      reason: "Gastroenterite hemorrágica - Fluidoterapia",
      status: "ADMITTED",
      admissionDate: new Date(),
      admissionById: vet.id,
      clinicId: clinic.id,
      tasks: {
        create: [
          { 
            description: "Controlo de Fluídos", 
            scheduledTime: new Date(new Date().setHours(new Date().getHours())),
            status: "PENDING"
          },
          { 
            description: "Monitorização Vital", 
            scheduledTime: new Date(new Date().setHours(new Date().getHours() + 3)),
            status: "PENDING"
          }
        ]
      }
    }
  });

  console.log(`Hospitalization Demo: Bolinha (Box 01) / Rex (Box 05)`);

  // 9. Health Plans
  console.log('Seeding health plans...');
  const basicPlan = await prisma.healthPlan.create({
    data: {
      clinicId: clinic.id,
      name: "Plano Preventivo Base",
      description: "Inclui vacinação anual e 2 consultas de rotina.",
      price: 15.00,
      billingCycle: "MONTHLY",
      isActive: true
    }
  });

  const premiumPlan = await prisma.healthPlan.create({
    data: {
      clinicId: clinic.id,
      name: "Plano Vitalidade Plus",
      description: "Vacinação completa, check-up anual, destartarização e 15% de desconto em cirurgias.",
      price: 35.00,
      billingCycle: "MONTHLY",
      isActive: true
    }
  });

  // 10. Subscriptions
  console.log('Seeding subscriptions...');
  await prisma.subscription.create({
    data: {
      clinicId: clinic.id,
      ownerId: customer1.id,
      patientId: patient1.id,
      planId: premiumPlan.id,
      status: "ACTIVE",
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  console.log("Seed finished successfully!");
  console.log(`Admin Login: marco@clinicavet.pt / admin123`);
  console.log(`Financial Hub Demo: Ricardo (Paid) / Ana (50€ Paid, 100€ Debt)`);
  console.log(`Hospitalization Demo: Bolinha (Box 01) / Rex (Box 05)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
