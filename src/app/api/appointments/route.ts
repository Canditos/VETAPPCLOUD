export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

// GET /api/appointments - List appointments for the current clinic
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const appointments = await tenantPrisma.appointment.findMany({
      where: {
        status: { not: "CANCELLED" },
        startTime: {
          gte: start ? new Date(start) : undefined,
          lte: end ? new Date(end) : undefined,
        },
      },
      include: {
        patient: {
          include: {
            owner: true,
          }
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: Request) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }
  
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);
  const body = await req.json();

  const { 
    patientId, 
    veterinarianId, 
    startTime, 
    endTime, 
    type,
    reason
  } = body;

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Limite global: Máximo de 5 consultas na mesma clínica em simultâneo
    const totalOverlapping = await tenantPrisma.appointment.count({
      where: {
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          }
        ],
      },
    });

    if (totalOverlapping >= 5) {
      return NextResponse.json(
        { error: "Limite máximo de 5 consultas em simultâneo na clínica atingido." },
        { status: 400 }
      );
    }

    // Verificação de sobreposição: O membro da equipa não pode ter outra marcação na mesma hora
    const overlapping = await tenantPrisma.appointment.findFirst({
      where: {
        veterinarianId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          }
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "O membro da equipa selecionado já tem uma marcação nesse horário." },
        { status: 400 }
      );
    }

    const appointment = await tenantPrisma.appointment.create({
      data: {
        patientId,
        veterinarianId,
        startTime: start,
        endTime: end,
        type,
        reason,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
