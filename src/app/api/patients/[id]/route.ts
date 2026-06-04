import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id }) => {
  try {
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
});

export const PATCH = withAuthParams(async ({ req, tenantPrisma }, { id }) => {
  try {
    const existing = await tenantPrisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
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
});

