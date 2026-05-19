import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const patient = await tenantPrisma.patient.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const existing = await tenantPrisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    if (existing.clinicId !== clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      species,
      breed,
      gender,
      birthDate,
      weight,
      microchip,
      reproductiveStatus,
      aggressionLevel,
      coatColor,
      allergies,
    } = body;

    const patient = await tenantPrisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(breed !== undefined && { breed }),
        ...(gender !== undefined && { gender }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(weight !== undefined && { weight: weight !== null ? parseFloat(weight.toString()) : null }),
        ...(microchip !== undefined && { microchip }),
        ...(reproductiveStatus !== undefined && { reproductiveStatus }),
        ...(aggressionLevel !== undefined && { aggressionLevel }),
        ...(coatColor !== undefined && { coatColor }),
        ...(allergies !== undefined && { allergies }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

