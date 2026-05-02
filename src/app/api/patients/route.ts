import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clinicId = "c1-demo-clinic";

  try {
    const patients = await prisma.patient.findMany({
      where: { clinicId },
      include: {
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (patients.length === 0) {
      return NextResponse.json([
        {
          id: "p1",
          name: "Bolinha",
          species: "Cão",
          breed: "Pastor Alemão",
          owner: { name: "Marco Cândido" }
        },
        {
          id: "p2",
          name: "Rex",
          species: "Cão",
          breed: "Labrador",
          owner: { name: "Ana Silva" }
        },
        {
          id: "p3",
          name: "Mimi",
          species: "Gato",
          breed: "Persa",
          owner: { name: "João Silva" }
        }
      ]);
    }

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Failed to load patients" }, { status: 500 });
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
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
