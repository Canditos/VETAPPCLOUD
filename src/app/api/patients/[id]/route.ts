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

    const patient = await tenantPrisma.patient.findUnique({
      where: { id },
      include: {
        owner: true,
        consultations: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            notes: true,
            veterinarian: { select: { name: true } }
          }
        },
        vitalSigns: {
          orderBy: { recordedAt: "desc" },
          take: 20
        },
        vaccinations: {
          orderBy: { appliedAt: "desc" }
        },
        dewormings: {
          orderBy: { appliedAt: "desc" }
        },
        prescriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            veterinarian: { select: { name: true } }
          }
        }
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (patient.clinicId !== clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_DETAIL_GET]", error);
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

    const existing = await tenantPrisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (existing.clinicId !== clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { microchip } = body;

    const patient = await tenantPrisma.patient.update({
      where: { id },
      data: {
        ...(microchip !== undefined && { microchip }),
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error("[PATIENT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
