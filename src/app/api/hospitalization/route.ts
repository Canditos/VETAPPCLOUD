import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const hospitalizations = await tenantPrisma.hospitalization.findMany({
      where: { status: "ADMITTED" },
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
    const tenantPrisma = getTenantClient(clinicId);
    const body = await req.json();

    if (!body.patientId || !body.reason) {
      return NextResponse.json({ error: "patientId e reason são obrigatórios" }, { status: 400 });
    }

    const hospitalization = await tenantPrisma.hospitalization.create({
      data: {
        patientId: body.patientId,
        boxNumber: body.boxNumber,
        reason: body.reason,
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
