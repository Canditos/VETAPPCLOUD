import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const species = searchParams.get("species") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

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
      tenantPrisma.patient.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      tenantPrisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[PATIENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const body = await req.json();

    let ownerId = body.ownerId;

    if (body.isNewOwner) {
      const owner = await tenantPrisma.owner.create({
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

    const patient = await tenantPrisma.patient.create({
      data: {
        clinicId,
        ownerId,
        name: body.name,
        species: body.species,
        breed: body.breed,
        gender: body.gender,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        weight: body.weight ? parseFloat(body.weight.toString().replace(",", ".")) : null,
        microchip: body.microchip || null,
        reproductiveStatus: body.reproductiveStatus,
        aggressionLevel: body.aggressionLevel,
        coatColor: body.coatColor,
        allergies: body.allergies,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
