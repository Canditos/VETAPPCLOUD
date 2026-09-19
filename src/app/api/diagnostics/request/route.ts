/**
 * API ROUTE: /api/diagnostics/request
 *
 * Responsabilidade: Criar um pedido de exame diagnostico (LAB ou IMAGING).
 * Para IMAGING, regista o estudo e devolve os dados para gerar o GDT
 * via /api/gdt/fazer-rx (download do ficheiro mgpcs.gdt para o Examion).
 *
 * Tenant: Sim
 * Auth: Requer sessao
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";

const RequestSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().optional(),
  appointmentId: z.string().optional(),
  type: z.enum(["LAB", "IMAGING"]),
  source: z.string().min(1),
  testName: z.string().min(1),
});

function getSampleLabParameters(testName: string) {
  const t = testName.toLowerCase();
  if (t.includes("hemo")) {
    return [
      { name: "Eritrócitos (RBC)", value: 7.15, unit: "M/µL", refMin: 5.5, refMax: 8.5, isAbnormal: false },
      { name: "Leucócitos (WBC)", value: 11.2, unit: "10³/µL", refMin: 6.0, refMax: 17.0, isAbnormal: false },
      { name: "Hemoglobina (HGB)", value: 14.1, unit: "g/dL", refMin: 12.0, refMax: 18.0, isAbnormal: false },
      { name: "Hematócrito (HCT)", value: 43.0, unit: "%", refMin: 37.0, refMax: 55.0, isAbnormal: false },
      { name: "Plaquetas (PLT)", value: 260, unit: "10³/µL", refMin: 200, refMax: 500, isAbnormal: false },
      { name: "VCM (MCV)", value: 68.2, unit: "fL", refMin: 60.0, refMax: 77.0, isAbnormal: false },
      { name: "HCM (MCH)", value: 22.4, unit: "pg", refMin: 19.5, refMax: 24.5, isAbnormal: false },
      { name: "Neutrófilos", value: 65, unit: "%", refMin: 60, refMax: 77, isAbnormal: false },
      { name: "Linfócitos", value: 24, unit: "%", refMin: 12, refMax: 30, isAbnormal: false },
    ];
  }
  if (t.includes("bioqu")) {
    return [
      { name: "ALT (GPT)", value: 48, unit: "U/L", refMin: 10, refMax: 100, isAbnormal: false },
      { name: "Creatinina", value: 1.1, unit: "mg/dL", refMin: 0.5, refMax: 1.6, isAbnormal: false },
      { name: "Ureia (BUN)", value: 29, unit: "mg/dL", refMin: 15, refMax: 40, isAbnormal: false },
      { name: "Glicose", value: 96, unit: "mg/dL", refMin: 70, refMax: 120, isAbnormal: false },
      { name: "Fosfatase Alcalina (ALP)", value: 64, unit: "U/L", refMin: 20, refMax: 150, isAbnormal: false },
      { name: "Proteínas Totais", value: 6.7, unit: "g/dL", refMin: 5.4, refMax: 7.8, isAbnormal: false },
      { name: "Albumina", value: 3.2, unit: "g/dL", refMin: 2.6, refMax: 4.0, isAbnormal: false },
      { name: "Fósforo", value: 4.2, unit: "mg/dL", refMin: 2.5, refMax: 6.0, isAbnormal: false },
    ];
  }
  if (t.includes("pcr")) {
    return [
      { name: "PCR Canina / Felina", value: 4.2, unit: "mg/L", refMin: 0.0, refMax: 10.0, isAbnormal: false },
    ];
  }
  if (t.includes("urin")) {
    return [
      { name: "Densidade Urinária", value: 1.035, unit: "g/ml", refMin: 1.015, refMax: 1.045, isAbnormal: false },
      { name: "pH", value: 6.5, unit: "", refMin: 5.5, refMax: 7.5, isAbnormal: false },
      { name: "Proteína", value: 0, unit: "mg/dL", refMin: 0, refMax: 30, isAbnormal: false },
      { name: "Glicose", value: 0, unit: "mg/dL", refMin: 0, refMax: 0, isAbnormal: false },
    ];
  }
  return [
    { name: "Parâmetro Geral", value: 1, unit: "", isAbnormal: false },
  ];
}

export const POST = withAuth(async ({ tenantPrisma, clinicId, userId, req }) => {
  const body = await req.json();
  const validation = RequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { patientId, consultationId, appointmentId, type, source, testName } = validation.data;

  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado" }, { status: 404 });
  }

  if (type === "LAB") {
    const parameters = getSampleLabParameters(testName);
    const labResult = await tenantPrisma.labResult.create({
      data: {
        clinicId,
        patientId,
        source,
        dataJson: {
          testName,
          requestedBy: userId,
          requestedAt: new Date().toISOString(),
          consultationId: consultationId || null,
          appointmentId: appointmentId || null,
          status: "COMPLETED",
          parameters,
        },
        abnormalFlags: parameters.some((p) => p.isAbnormal),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pedido de ${testName} registado em ${source}.`,
      id: labResult.id,
      data: labResult,
    });
  }

  // IMAGING: register study in database
  const imagingStudy = await tenantPrisma.imagingStudy.create({
    data: {
      clinicId,
      patientId,
      dicomUrl: "pending",
      metadataJson: {
        testName,
        source,
        requestedBy: userId,
        requestedAt: new Date().toISOString(),
        consultationId: consultationId || null,
        appointmentId: appointmentId || null,
        bodyPart: testName.toLowerCase().includes("tórax")
          ? "Tórax"
          : testName.toLowerCase().includes("abdómen")
          ? "Abdómen"
          : testName.toLowerCase().includes("membro")
          ? "Membros"
          : "Geral",
        modality: testName.toLowerCase().includes("ecografia") ? "US" : "DX",
        views: ["Latero-Lateral (LL)", "Ventrodorsal (VD)"],
        observations: "Estruturas radiografadas sem alterações anatómicas evidentes.",
        status: "COMPLETED",
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: `Pedido de ${testName} registado. Use /api/gdt/fazer-rx para gerar o ficheiro GDT.`,
    id: imagingStudy.id,
    data: imagingStudy,
  });
});
