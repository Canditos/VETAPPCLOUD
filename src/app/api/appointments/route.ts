export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

// GET /api/appointments - List appointments for the current clinic
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  try {
    const appointments = await tenantPrisma.appointment.findMany({
      where: {
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
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: Request) {
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
    type 
  } = body;

  try {
    const appointment = await tenantPrisma.appointment.create({
      data: {
        patientId,
        veterinarianId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
