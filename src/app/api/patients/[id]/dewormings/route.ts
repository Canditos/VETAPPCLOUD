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

    const dewormings = await prisma.deworming.findMany({
      where: { patientId },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json(dewormings);
  } catch (error: any) {
    console.error("[DEWORMINGS_GET]", error);
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
}
