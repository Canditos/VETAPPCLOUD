import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const vitals = await prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(vitals);
  } catch (error: any) {
    console.error("[VITALS_GET]", error);
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
    const { weight, temperature, heartRate, respiratoryRate, notes, recordedAt } = body;

    const vital = await prisma.vitalSign.create({
      data: {
        patientId,
        weight: weight ? parseFloat(weight) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    // Also update patient weight if provided
    if (weight) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { weight: parseFloat(weight) }
      });
    }

    return NextResponse.json(vital);
  } catch (error: any) {
    console.error("[VITALS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
