import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  try {
    // Fetch all related entities for a complete history
    const [consultations, labResults, imagingStudies, vaccinations, dewormings, prescriptions, vitals] = await Promise.all([
      tenantPrisma.consultation.findMany({
        where: { patientId: params.id },
        include: {
          notes: true,
          invoice: true,
          veterinarian: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
      tenantPrisma.labResult.findMany({
        where: { patientId: params.id },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.imagingStudy.findMany({
        where: { patientId: params.id },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.vaccination.findMany({
        where: { patientId: params.id },
        orderBy: { appliedAt: "desc" },
      }),
      tenantPrisma.deworming.findMany({
        where: { patientId: params.id },
        orderBy: { appliedAt: "desc" },
      }),
      tenantPrisma.prescription.findMany({
        where: { patientId: params.id },
        include: { items: true, veterinarian: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.vitalSign.findMany({
        where: { patientId: params.id },
        orderBy: { recordedAt: "desc" },
      }),
    ]);

    // Merge and sort all events by date
    const history = [
      ...consultations.map(c => ({
        type: "CONSULTATION",
        id: c.id,
        date: c.date,
        title: "Consulta Clínica",
        subtitle: `Dr(a). ${c.veterinarian.name}`,
        status: c.status,
        data: c
      })),
      ...labResults.map(l => ({
        type: "LAB_RESULT",
        id: l.id,
        date: l.createdAt,
        title: "Análises Clínicas",
        subtitle: l.source,
        status: "COMPLETED",
        data: l
      })),
      ...imagingStudies.map(i => ({
        type: "IMAGING",
        id: i.id,
        date: i.createdAt,
        title: "Exame de Imagem",
        subtitle: "RX / Ecografia",
        status: "COMPLETED",
        data: i
      })),
      ...vaccinations.map(v => ({
        type: "VACCINATION",
        id: v.id,
        date: v.appliedAt,
        title: `Vacinação: ${v.vaccineName}`,
        subtitle: v.batchNumber ? `Lote: ${v.batchNumber}` : "Sem lote registado",
        status: "COMPLETED",
        data: v
      })),
      ...dewormings.map(d => ({
        type: "DEWORMING",
        id: d.id,
        date: d.appliedAt,
        title: `Desparasitação ${d.type}`,
        subtitle: d.productName,
        status: "COMPLETED",
        data: d
      })),
      ...prescriptions.map(p => ({
        type: "PRESCRIPTION",
        id: p.id,
        date: p.createdAt,
        title: "Prescrição Médica",
        subtitle: `Emitida por Dr. ${p.veterinarian?.name || "VetConnect"}`,
        status: "ACTIVE",
        data: p
      })),
      ...vitals.map(v => ({
        type: "VITALS",
        id: v.id,
        date: v.recordedAt,
        title: "Sinais Vitais",
        subtitle: `${v.weight ? v.weight + "kg" : ""} ${v.temperature ? v.temperature + "ºC" : ""}`,
        status: "COMPLETED",
        data: v
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
