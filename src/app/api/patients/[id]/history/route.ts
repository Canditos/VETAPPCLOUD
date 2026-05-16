import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  try {
    const { id } = await params;

    const patient = await tenantPrisma.patient.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    const [consultations, labResults, imagingStudies, vaccinations, dewormings, prescriptions, vitals, messages, payments] = await Promise.all([
      tenantPrisma.consultation.findMany({
        where: { patientId: id },
        include: {
          notes: true,
          invoice: true,
          veterinarian: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
      tenantPrisma.labResult.findMany({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.imagingStudy.findMany({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.vaccination.findMany({
        where: { patientId: id },
        orderBy: { appliedAt: "desc" },
      }),
      tenantPrisma.deworming.findMany({
        where: { patientId: id },
        orderBy: { appliedAt: "desc" },
      }),
      tenantPrisma.prescription.findMany({
        where: { patientId: id },
        include: { items: true, veterinarian: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      tenantPrisma.vitalSign.findMany({
        where: { patientId: id },
        orderBy: { recordedAt: "desc" },
      }),
      // Puxar mensagens relacionadas ao tutor deste animal
      tenantPrisma.portalMessage.findMany({
        where: { ownerId: patient?.ownerId, clinicId },
        orderBy: { createdAt: "desc" },
      }),
      // Puxar pagamentos
      tenantPrisma.payment.findMany({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
      })
    ]);

    const history = [
      ...consultations.map((c: any) => ({
        type: "CONSULTATION",
        id: c.id,
        date: c.date,
        title: "Consulta Clínica",
        subtitle: `Dr(a). ${c.veterinarian.name}`,
        status: c.status,
        data: c
      })),
      ...labResults.map((l: any) => ({
        type: "LAB_RESULT",
        id: l.id,
        date: l.createdAt,
        title: "Análises Clínicas",
        subtitle: l.source,
        status: "COMPLETED",
        data: l
      })),
      ...imagingStudies.map((i: any) => ({
        type: "IMAGING",
        id: i.id,
        date: i.createdAt,
        title: "Exame de Imagem",
        subtitle: "RX / Ecografia",
        status: "COMPLETED",
        data: i
      })),
      ...vaccinations.map((v: any) => ({
        type: "VACCINATION",
        id: v.id,
        date: v.appliedAt,
        title: `Vacinação: ${v.vaccineName}`,
        subtitle: v.batchNumber ? `Lote: ${v.batchNumber}` : "Sem lote registado",
        status: "COMPLETED",
        data: v
      })),
      ...dewormings.map((d: any) => ({
        type: "DEWORMING",
        id: d.id,
        date: d.appliedAt,
        title: `Desparasitação ${d.type}`,
        subtitle: d.productName,
        status: "COMPLETED",
        data: d
      })),
      ...prescriptions.map((p: any) => ({
        type: "PRESCRIPTION",
        id: p.id,
        date: p.createdAt,
        title: "Prescrição Médica",
        subtitle: `Emitida por Dr. ${p.veterinarian?.name || "VetConnect"}`,
        status: "ACTIVE",
        data: p
      })),
      ...vitals.map((v: any) => ({
        type: "VITALS",
        id: v.id,
        date: v.recordedAt,
        title: "Sinais Vitais",
        subtitle: `${v.weight ? v.weight + "kg" : ""} ${v.temperature ? v.temperature + "ºC" : ""}`,
        status: "COMPLETED",
        data: v
      })),
      ...messages.map(m => ({
        type: "MESSAGE",
        id: m.id,
        date: m.createdAt,
        title: m.senderType === "TUTOR" ? "Mensagem do Tutor" : "Mensagem da Clínica",
        subtitle: m.content.substring(0, 50) + (m.content.length > 50 ? "..." : ""),
        status: "READ",
        data: m
      })),
      ...payments.map(p => ({
        type: "PAYMENT",
        id: p.id,
        date: p.createdAt,
        title: "Pagamento Registado",
        subtitle: `Valor: €${Number(p.amount).toFixed(2)} (${p.method})`,
        status: "PAID",
        data: p
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
