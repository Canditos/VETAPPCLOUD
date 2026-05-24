import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ clinicId, tenantPrisma }, { id }) => {
  try {
    const patient = await tenantPrisma.patient.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    const [consultations, labResults, imagingStudies, vaccinations, dewormings, prescriptions, vitals, payments, appointments] = await Promise.all([
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
      // Puxar pagamentos (pelo dono, não pelo paciente — Payment não tem patientId)
      patient?.ownerId ? tenantPrisma.payment.findMany({
        where: { ownerId: patient.ownerId },
        orderBy: { createdAt: "desc" },
      }) : Promise.resolve([]),
      tenantPrisma.appointment.findMany({
        where: { patientId: id, status: "COMPLETED", consultationId: null },
        orderBy: { startTime: "desc" },
      }),
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
      ...payments.map((p: any) => ({
        type: "PAYMENT",
        id: p.id,
        date: p.createdAt,
        title: "Pagamento Registado",
        subtitle: `Valor: €${Number(p.amount).toFixed(2)} (${p.method})`,
        status: "PAID",
        data: p
      })),
      ...appointments.map((a: any) => ({
        type: "CONSULTATION",
        id: a.id,
        date: a.startTime,
        title: a.type || "Consulta",
        subtitle: a.reason || "",
        status: "COMPLETED",
        data: {
          ...a,
          source: a.id?.startsWith?.("weopet-") ? "weoPet" : "sistema",
          veterinarian: { name: a.id?.startsWith?.("weopet-") ? "Histórico weoPet" : "VetConnect" }
        }
      }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
