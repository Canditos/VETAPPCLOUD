import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    const hospitalizations = await prisma.hospitalization.findMany({
      where: { status: "ADMITTED", clinicId },
      include: {
        patient: { include: { owner: true } },
        admissionBy: { select: { name: true } },
        tasks: {
          orderBy: { scheduledTime: "asc" },
          include: { completedBy: { select: { name: true } } },
        },
      },
      orderBy: { admissionDate: "asc" },
    });

    return NextResponse.json(hospitalizations);
  } catch (error) {
    console.error("[HOSPITALIZATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const userId = (session.user as any).id;
    const body = await req.json();

    const hospitalization = await prisma.hospitalization.create({
      data: {
        patientId: body.patientId,
        boxNumber: body.boxNumber,
        reason: body.reason,
        clinicId,
        admissionById: userId,
        status: "ADMITTED",
      },
    });

    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("[HOSPITALIZATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
