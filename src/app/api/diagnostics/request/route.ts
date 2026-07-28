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
  type: z.enum(["LAB", "IMAGING"]),
  source: z.string().min(1),
  testName: z.string().min(1),
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, userId, req }) => {
  const body = await req.json();
  const validation = RequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { patientId, consultationId, type, source, testName } = validation.data;

  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado" }, { status: 404 });
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
      message: `Pedido de ${testName} registado em ${source}.`,
      id: labResult.id,
    });
  }

  // IMAGING: register study in database
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
    message: `Pedido de ${testName} registado. Use /api/gdt/fazer-rx para gerar o ficheiro GDT.`,
    id: imagingStudy.id,
  });
});
