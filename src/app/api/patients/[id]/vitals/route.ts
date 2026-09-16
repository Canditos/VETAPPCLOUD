export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const vitals = await tenantPrisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { date: "desc" },
      take: 200,
    });

    return NextResponse.json(vitals);
  } catch (error) {
    console.error("[VITALS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});

export const POST = withAuthParams(async ({ req, tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await req.json();
    const { weight, temperature, heartRate, respiratoryRate, notes, date } = body;

    const vital = await tenantPrisma.$transaction(async (tx) => {
      const created = await tx.vitalSign.create({
        data: {
          patientId,
          weight: weight ? parseFloat(weight) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          heartRate: heartRate ? parseInt(heartRate) : null,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
          notes,
          date: date ? new Date(date) : new Date(),
        },
      });

      if (weight) {
        await tx.patient.updateMany({
          where: { id: patientId },
          data: { weight: parseFloat(weight) },
        });
      }

      return created;
    });

    return NextResponse.json(vital);
  } catch (error) {
    console.error("[VITALS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
