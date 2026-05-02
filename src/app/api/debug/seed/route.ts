import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    console.log("Starting API-driven seed...");

    // 1. Create Clinic
    const clinic = await prisma.clinic.upsert({
      where: { id: 'c1-demo-clinic' },
      update: {},
      create: {
        id: 'c1-demo-clinic',
        name: "Hospital Veterinário Gato Escondido",
        address: "Avenida da Liberdade 123, Palmela",
        vatNumber: "500987654",
        phone: "210 000 000",
        email: "geral@gatoescondido.pt",
      },
    });

    // 2. Create Users
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "marco@clinicavet.pt" },
      update: {},
      create: {
        name: "Dr. Marco António",
        email: "marco@clinicavet.pt",
        passwordHash,
        role: "ADMIN",
        clinicId: clinic.id,
      },
    });

    await prisma.user.upsert({
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
    await prisma.product.create({
      data: {
        name: "Consulta Geral",
        price: 45.0,
        vatRate: 23,
        stockQuantity: 999,
        category: "Serviços",
        clinicId: clinic.id,
      }
    });

    // 6. Invoices & Payments
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

    return NextResponse.json({ message: "Database seeded successfully!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
