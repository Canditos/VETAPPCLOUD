import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Demo Mode: Always return mock data first to ensure UI is never empty
  const mockPatients = [
    {
      id: "p1",
      name: "Bolinha",
      species: "Cão",
      breed: "Pastor Alemão",
      owner: { name: "Marco Cândido", email: "marco@example.com" },
      lastVisit: new Date().toISOString()
    },
    {
      id: "p2",
      name: "Rex",
      species: "Cão",
      breed: "Labrador",
      owner: { name: "Ana Silva", email: "ana@vet.pt" },
      lastVisit: new Date().toISOString()
    },
    {
      id: "p3",
      name: "Mimi",
      species: "Gato",
      breed: "Persa",
      owner: { name: "João Silva", email: "joao@gmail.com" },
      lastVisit: new Date().toISOString()
    }
  ];

  try {
    const patients = await prisma.patient.findMany({
      where: { clinicId: "c1-demo-clinic" },
      include: {
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (patients && patients.length > 0) {
      return NextResponse.json(patients);
    }
    
    return NextResponse.json(mockPatients);
  } catch (error) {
    console.error("Database error, returning mocks:", error);
    return NextResponse.json(mockPatients);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const patient = await prisma.patient.create({
      data: {
        clinicId: "c1-demo-clinic",
        ownerId: body.ownerId,
        name: body.name,
        species: body.species,
        breed: body.breed,
      },
    });
    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
