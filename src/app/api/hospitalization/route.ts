export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

// GET /api/hospitalization - List active hospitalizations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  try {
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
    console.error("Error fetching hospitalizations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/hospitalization - Admit a patient
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const userId = (session.user as any).id;
  const tenantPrisma = getTenantClient(clinicId);
  const body = await req.json();

  const { patientId, boxNumber, reason, tasks } = body;

  if (!patientId || !reason) {
    return NextResponse.json({ error: "patientId e reason são obrigatórios" }, { status: 400 });
  }

  try {
    const hospitalization = await tenantPrisma.hospitalization.create({
      data: {
        patientId,
        boxNumber,
        reason,
        admissionById: userId,
        status: "ADMITTED",
        tasks: tasks?.length
          ? {
              create: tasks.map((t: any) => ({
                description: t.description,
                scheduledTime: new Date(t.scheduledTime),
              })),
            }
          : undefined,
      },
      include: {
        patient: { include: { owner: true } },
        tasks: true,
      },
    });

    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("Error admitting patient:", error);
    return NextResponse.json({ error: "Falha ao internar paciente" }, { status: 500 });
  }
}
