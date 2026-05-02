import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clinicId = "c1-demo-clinic";

  try {
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

    if (hospitalizations.length === 0) {
      return NextResponse.json([
        {
          id: "demo-hosp-1",
          patient: {
            name: "Bolinha",
            owner: { name: "Marco Cândido" }
          },
          boxNumber: "BOX 01",
          reason: "Recuperação Pós-Cirúrgica",
          status: "ADMITTED",
          admissionDate: new Date(),
          admissionBy: { name: "Dra. Sara" },
          tasks: [
            { id: "t1", description: "Medição de Temperatura", scheduledTime: new Date(Date.now() + 2*3600000), status: "PENDING" },
            { id: "t2", description: "Administração de Antibiótico", scheduledTime: new Date(Date.now() - 1*3600000), status: "COMPLETED", completedBy: { name: "Auxiliar João" } }
          ]
        },
        {
          id: "demo-hosp-2",
          patient: {
            name: "Rex",
            owner: { name: "Ana Silva" }
          },
          boxNumber: "BOX 05",
          reason: "Fluidoterapia - Gastroenterite",
          status: "ADMITTED",
          admissionDate: new Date(),
          admissionBy: { name: "Dr. Pedro" },
          tasks: [
            { id: "t3", description: "Controlo de Soros", scheduledTime: new Date(), status: "PENDING" }
          ]
        }
      ]);
    }

    return NextResponse.json(hospitalizations);
  } catch (error) {
    console.error("Error fetching hospitalizations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const hospitalization = await prisma.hospitalization.create({
      data: {
        patientId: body.patientId,
        boxNumber: body.boxNumber,
        reason: body.reason,
        clinicId: "c1-demo-clinic",
        admissionById: "admin-id",
        status: "ADMITTED",
      },
    });
    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("Error admitting patient:", error);
    return NextResponse.json({ error: "Falha ao internar paciente" }, { status: 500 });
  }
}
