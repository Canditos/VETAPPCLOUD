/**
 * API ROUTE: /api/diagnostics/request
 *
 * Responsabilidade: Criar um pedido de exame diagnóstico (LAB ou IMAGING)
 * e guardá-lo na base de dados. Simula o envio para integradores HL7/DICOM.
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";

const RequestSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().optional(),
  type: z.enum(["LAB", "IMAGING"]),
  source: z.string().min(1),
  testName: z.string().min(1),
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, userId, req }) => {
  const body = await req.json();
  const validation = RequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { patientId, consultationId, type, source, testName } = validation.data;

  // Verify patient belongs to clinic
  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  if (type === "LAB") {
    const labResult = await tenantPrisma.labResult.create({
      data: {
        clinicId,
        patientId,
        source,
        dataJson: { testName, requestedBy: userId, requestedAt: new Date().toISOString() },
        abnormalFlags: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pedido de ${testName} registado em ${source}. Resultado pendente.`,
      id: labResult.id,
    });
  } else {
    const imagingStudy = await tenantPrisma.imagingStudy.create({
      data: {
        clinicId,
        patientId,
        dicomUrl: "pending",
        metadataJson: { testName, requestedBy: userId, requestedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pedido de ${testName} registado em ${source}. Estudo pendente.`,
      id: imagingStudy.id,
    });
  }
});
