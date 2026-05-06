export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

// GET /api/appointments - List appointments for the current clinic
export async function GET(req: Request) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json([]);
  }
  
  const session = await getServerSession(authOptions);
  
  // Demo Fallback for stakeholders
  const clinicId = session ? (session.user as any).clinicId : "c1-demo-clinic";
  const tenantPrisma = getTenantClient(clinicId);

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

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

    if (appointments && appointments.length > 0) {
      return NextResponse.json(appointments);
    }

    // Dynamic Mock injection for current day
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return NextResponse.json([
      {
        id: "app-1",
        startTime: `${todayStr}T10:00:00Z`,
        type: "VACINA",
        status: "SCHEDULED",
        veterinarianId: "v1",
        vetName: "Dr. Marco Cândido",
        patient: { 
          id: "p1", 
          name: "Bolinha", 
          owner: { name: "Maria Alice" } 
        }
      },
      {
        id: "app-2",
        startTime: `${todayStr}T11:00:00Z`,
        type: "CIRURGIA",
        status: "SCHEDULED",
        veterinarianId: "v2",
        vetName: "Dra. Ana Silva",
        patient: { 
          id: "p2", 
          name: "Rex", 
          owner: { name: "Ricardo Fonseca" } 
        }
      },
      {
        id: "app-3",
        startTime: `${todayStr}T15:00:00Z`,
        type: "CONSULTA",
        status: "SCHEDULED",
        veterinarianId: "v1",
        vetName: "Dr. Marco Cândido",
        patient: { 
          id: "p3", 
          name: "Luna", 
          owner: { name: "José Pedro" } 
        }
      },
      {
        id: "app-4",
        startTime: `${todayStr}T16:00:00Z`,
        type: "URGÊNCIA",
        status: "SCHEDULED",
        veterinarianId: "v3",
        vetName: "Dr. Roberto",
        patient: { 
          id: "p4", 
          name: "Miau", 
          owner: { name: "Carla Antunes" } 
        }
      }
    ]);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
