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

    const dewormings = await tenantPrisma.deworming.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(dewormings);
  } catch (error) {
    console.error("[DEWORMINGS_GET]", error);
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
    const { type, productName, batchNumber, appliedAt, expiresAt, notes } = body;

    if (!type || !productName) {
      return NextResponse.json({ error: "Type and product name are required" }, { status: 400 });
    }

    const deworming = await tenantPrisma.deworming.create({
      data: {
        patientId,
        type,
        productName,
        batchNumber,
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
      },
    });

    await audit({ clinicId, userId, action: "CREATE", entity: "Deworming", entityId: deworming.id });

    return NextResponse.json(deworming);
  } catch (error) {
    console.error("[DEWORMINGS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
