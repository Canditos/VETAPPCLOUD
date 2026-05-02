export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

// GET /api/patients - List all patients for the current clinic
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  const patients = await tenantPrisma.patient.findMany({
    include: {
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(patients);
}

// POST /api/patients - Create a new patient and owner
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  const { name, species, breed, birthDate, ownerName, ownerEmail, ownerPhone } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or find owner
      let owner = await tx.owner.findFirst({
        where: { clinicId, email: ownerEmail },
      });

      if (!owner) {
        owner = await tx.owner.create({
          data: {
            clinicId,
            name: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
          },
        });
      }

      // 2. Create patient
      const patient = await tx.patient.create({
        data: {
          clinicId,
          ownerId: owner.id,
          name,
          species,
          breed,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });

      return patient;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
