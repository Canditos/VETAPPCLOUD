import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const dewormings = await prisma.deworming.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json(dewormings);
  } catch (error: any) {
    console.error("[DEWORMINGS_GET]", error);
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
    const { type, productName, batchNumber, appliedAt, expiresAt, notes } = body;

    if (!type || !productName) {
      return NextResponse.json({ error: "Type and product name are required" }, { status: 400 });
    }

    const deworming = await prisma.deworming.create({
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

    return NextResponse.json(deworming);
  } catch (error: any) {
    console.error("[DEWORMINGS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
