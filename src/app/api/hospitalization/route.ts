import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clinicId = "c1-demo-clinic";
  const mockHospitalizations = [
    {
      id: "demo-hosp-1",
      patientId: "p1",
      patient: {
        id: "p1",
        name: "Bolinha",
        species: "Cão",
        owner: { name: "Marco Cândido" }
      },
      boxNumber: "BOX 01",
      reason: "Recuperação Pós-Cirúrgica",
      status: "ADMITTED",
      admissionDate: new Date().toISOString(),
      admissionBy: { name: "Dra. Sara" },
      tasks: [
        { id: "t1", description: "Medição de Temperatura", scheduledTime: new Date(Date.now() + 2*3600000).toISOString(), status: "PENDING" },
        { id: "t2", description: "Administração de Antibiótico", scheduledTime: new Date(Date.now() - 1*3600000).toISOString(), status: "COMPLETED", completedBy: { name: "Auxiliar João" } }
      ]
    },
    {
      id: "demo-hosp-2",
      patientId: "p2",
      patient: {
        id: "p2",
        name: "Rex",
        species: "Cão",
        owner: { name: "Ana Silva" }
      },
      boxNumber: "BOX 05",
      reason: "Fluidoterapia - Gastroenterite",
      status: "ADMITTED",
      admissionDate: new Date().toISOString(),
      admissionBy: { name: "Dr. Pedro" },
      tasks: [
        { id: "t3", description: "Controlo de Soros", scheduledTime: new Date().toISOString(), status: "PENDING" }
      ]
    }
  ];

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

    if (hospitalizations && hospitalizations.length > 0) {
      return NextResponse.json(hospitalizations);
    }
    return NextResponse.json(mockHospitalizations);
  } catch (error) {
    console.error("Hosp error, returning mocks:", error);
    return NextResponse.json(mockHospitalizations);
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
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}
