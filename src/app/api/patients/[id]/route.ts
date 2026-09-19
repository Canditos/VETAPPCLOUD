import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";
import { audit } from "@/lib/audit";

export const GET = withAuthParams(async ({ tenantPrisma, clinicId, userId, session }, { id }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({
      where: { id, clinicId },
      include: {
        owner: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    await audit({ clinicId, userId, userName: session?.user?.name ?? null, action: "VIEW", entity: "Patient", entityId: id });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const PATCH = withAuthParams(async ({ req, tenantPrisma, clinicId, userId, session }, { id }) => {
  try {
    const existing = await tenantPrisma.patient.findFirst({
      where: { id, clinicId },
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
      status,
    } = body;

    const sanitizedMicrochip = microchip !== undefined 
      ? (typeof microchip === "string" && microchip.trim() ? microchip.trim() : null)
      : undefined;

    const sanitizedBirthDate = birthDate !== undefined
      ? (birthDate ? new Date(birthDate) : null)
      : undefined;

    const sanitizedWeight = weight !== undefined
      ? (weight !== null && weight !== "" && !isNaN(Number(weight)) ? parseFloat(weight.toString()) : null)
      : undefined;

    const sanitizedAggression = aggressionLevel !== undefined
      ? (typeof aggressionLevel === "string" && aggressionLevel.trim() ? aggressionLevel.trim() : null)
      : undefined;

    const sanitizedAllergies = allergies !== undefined
      ? (typeof allergies === "string" && allergies.trim() ? allergies.trim() : null)
      : undefined;

    const patient = await tenantPrisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(species !== undefined && { species: species.trim() }),
        ...(breed !== undefined && { breed: breed?.trim() || null }),
        ...(gender !== undefined && { gender }),
        ...(sanitizedBirthDate !== undefined && { birthDate: sanitizedBirthDate }),
        ...(sanitizedWeight !== undefined && { weight: sanitizedWeight }),
        ...(sanitizedMicrochip !== undefined && { microchip: sanitizedMicrochip }),
        ...(reproductiveStatus !== undefined && { reproductiveStatus }),
        ...(sanitizedAggression !== undefined && { aggressionLevel: sanitizedAggression }),
        ...(coatColor !== undefined && { coatColor: coatColor?.trim() || null }),
        ...(sanitizedAllergies !== undefined && { allergies: sanitizedAllergies }),
        ...(status !== undefined && { status }),
      },
    });

    await audit({ clinicId, userId, userName: session?.user?.name ?? null, action: "UPDATE", entity: "Patient", entityId: id });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("[PATIENT_PATCH]", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Já existe outro paciente registado com este microchip." }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Erro interno ao atualizar paciente" }, { status: 500 });
  }
});

