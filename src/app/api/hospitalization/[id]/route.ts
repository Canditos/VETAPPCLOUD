import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const hospitalization = await tenantPrisma.hospitalization.findUnique({
      where: { id },
      include: {
        patient: { include: { owner: true } },
        admissionBy: { select: { name: true } },
        tasks: {
          orderBy: { scheduledTime: "asc" },
          include: { completedBy: { select: { name: true } } },
        },
      },
    });

    if (!hospitalization) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("[HOSPITALIZATION_DETAIL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const existing = await tenantPrisma.hospitalization.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, boxNumber, reason, dischargeDate } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (boxNumber !== undefined) data.boxNumber = boxNumber;
    if (reason !== undefined) data.reason = reason;
    if (status === "DISCHARGED") {
      data.dischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();
    }

    const hospitalization = await tenantPrisma.hospitalization.update({
      where: { id },
      data,
      include: {
        patient: { include: { owner: true } },
        admissionBy: { select: { name: true } },
        tasks: {
          orderBy: { scheduledTime: "asc" },
          include: { completedBy: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("[HOSPITALIZATION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
