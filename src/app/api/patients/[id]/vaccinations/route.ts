export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";
import { audit } from "@/lib/audit";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const vaccinations = await tenantPrisma.vaccination.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(vaccinations);
  } catch (error) {
    console.error("[VACCINATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});

export const POST = withAuthParams(async ({ req, tenantPrisma, clinicId, userId }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await req.json();
    const { vaccineName, batchNumber, appliedAt, expiresAt, notes } = body;

    if (!vaccineName) {
      return NextResponse.json({ error: "Vaccine name is required" }, { status: 400 });
    }

    const vaccination = await tenantPrisma.vaccination.create({
      data: {
        patientId,
        vaccineName,
        batchNumber,
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
      },
    });

    await audit({ clinicId, userId, action: "CREATE", entity: "Vaccination", entityId: vaccination.id });

    return NextResponse.json(vaccination);
  } catch (error) {
    console.error("[VACCINATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
