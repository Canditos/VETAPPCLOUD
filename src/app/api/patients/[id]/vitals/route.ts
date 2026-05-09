import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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
}
