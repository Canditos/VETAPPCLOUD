import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Starting API-driven idempotent seed...");

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

    // 3. Create Customers (Hub 360º)
    const customer1 = await prisma.owner.upsert({
      where: { email: "ricardo.fonseca@email.com" },
      update: {},
      create: {
        id: "demo-owner-1",
        name: "Ricardo Fonseca",
        email: "ricardo.fonseca@email.com",
        phone: "910 000 001",
        vatNumber: "234567890",
        address: "Rua dos Animais, 45, Setúbal",
        notes: "Cliente habitual, prefere contacto via WhatsApp.",
        clinicId: clinic.id,
      }
    });

    const customer2 = await prisma.owner.upsert({
      where: { email: "ana.martins@email.com" },
      update: {},
      create: {
        id: "demo-owner-2",
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
    const patient1 = await prisma.patient.upsert({
      where: { id: "p1" },
      update: {},
      create: {
        id: "p1",
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

    const patient2 = await prisma.patient.upsert({
      where: { id: "p2" },
      update: {},
      create: {
        id: "p2",
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
    await prisma.product.upsert({
      where: { id: "prod-consulta" },
      update: {},
      create: {
        id: "prod-consulta",
        name: "Consulta Geral",
        price: 45.0,
        vatRate: 23,
        stockQuantity: 999,
        category: "Serviços",
        clinicId: clinic.id,
      }
    });

    // 6. Hospitalization
    const hosp1 = await prisma.hospitalization.upsert({
      where: { id: "demo-hosp-1" },
      update: {},
      create: {
        id: "demo-hosp-1",
        patientId: patient1.id,
        boxNumber: "BOX 01",
        reason: "Recuperação Pós-Cirúrgica",
        status: "ADMITTED",
        admissionDate: new Date(),
        clinicId: clinic.id,
        admissionById: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || "admin-id"
      }
    });

    return NextResponse.json({ message: "Database seeded successfully!" });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
