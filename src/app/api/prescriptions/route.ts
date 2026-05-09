import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const clinicId = (session.user as any).clinicId;

    const prescriptions = await prisma.prescription.findMany({
      where: { 
        clinicId,
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
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const body = await request.json();
    const { patientId, consultationId, validUntil, items } = body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Patient ID and items are required" }, { status: 400 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        clinicId,
        patientId,
        veterinarianId: (session.user as any).id,
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
}
