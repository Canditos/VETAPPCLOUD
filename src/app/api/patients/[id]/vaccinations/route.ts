import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const vaccinations = await prisma.vaccination.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json(vaccinations);
  } catch (error: any) {
    console.error("[VACCINATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});

export const POST = withAuthParams(async ({ req, tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await req.json();
    const { vaccineName, batchNumber, appliedAt, expiresAt, notes } = body;

    if (!vaccineName) {
      return NextResponse.json({ error: "Vaccine name is required" }, { status: 400 });
    }

    const vaccination = await prisma.vaccination.create({
      data: {
        patientId,
        vaccineName,
        batchNumber,
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
      },
    });

    return NextResponse.json(vaccination);
  } catch (error: any) {
    console.error("[VACCINATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
