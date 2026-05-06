import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clinicId = "c1-demo-clinic";
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const species = searchParams.get("species") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const where: any = { clinicId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { microchip: { contains: search } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (species) {
      where.species = species;
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    if (patients.length > 0) {
      return NextResponse.json({
        data: patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fallback for empty database
    return NextResponse.json({
      data: [
        {
          id: "p1",
          name: "Bolinha",
          species: "Gato",
          breed: "Siamês",
          gender: "F",
          ownerId: "demo-owner-1",
          owner: { id: "demo-owner-1", name: "Ricardo Fonseca", phone: "910 000 001" },
        },
        {
          id: "p2",
          name: "Rex",
          species: "Cão",
          breed: "Pastor Alemão",
          gender: "M",
          ownerId: "demo-owner-2",
          owner: { id: "demo-owner-2", name: "Ana Martins", phone: "960 000 002" },
        },
      ],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({
      data: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clinicId = "c1-demo-clinic";

    let ownerId = body.ownerId;

    // If it's a new owner, create it first
    if (body.isNewOwner) {
      const owner = await prisma.owner.create({
        data: {
          clinicId,
          name: body.ownerName,
          email: body.ownerEmail,
          phone: body.ownerPhone,
        },
      });
      ownerId = owner.id;
    }

    if (!ownerId) {
      return NextResponse.json({ error: "Owner ID is required" }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        ownerId,
        name: body.name,
        species: body.species,
        breed: body.breed,
        gender: body.gender,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        weight: body.weight ? parseFloat(body.weight.replace(",", ".")) : null,
        microchip: body.microchip || null,
        reproductiveStatus: body.reproductiveStatus,
        aggressionLevel: body.aggressionLevel,
        coatColor: body.coatColor,
        allergies: body.allergies,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Failed to create patient and/or owner" }, { status: 500 });
  }
}
