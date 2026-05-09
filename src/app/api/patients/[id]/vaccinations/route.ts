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

    const vaccinations = await prisma.vaccination.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json(vaccinations);
  } catch (error: any) {
    console.error("[VACCINATIONS_GET]", error);
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
}
