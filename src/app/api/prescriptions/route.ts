import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ req, tenantPrisma }) => {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    const prescriptions = await tenantPrisma.prescription.findMany({
      where: { 
        ...(patientId ? { patientId } : {})
      },
      include: {
        items: true,
        patient: { select: { name: true, species: true } },
        veterinarian: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prescriptions);
  } catch (error: any) {
    console.error("[PRESCRIPTIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req, tenantPrisma, clinicId, userId }) => {
  try {
    const body = await req.json();
    const { patientId, consultationId, validUntil, items } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Patient ID and items are required" }, { status: 400 });
    }

    const prescription = await tenantPrisma.prescription.create({
      data: {
        clinicId,
        patientId,
        veterinarianId: userId,
        consultationId,
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: items.map((item: any) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            notes: item.notes,
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(prescription);
  } catch (error: any) {
    console.error("[PRESCRIPTIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
