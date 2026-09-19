/**
 * API ROUTE: /api/diagnostics
 *
 * Responsabilidade: Listar todos os resultados diagnósticos
 * (laboratório + imagiologia) da clínica, formatados para consumo UI.
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import type { DiagnosticResult } from "@/types";

export const GET = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");
  const consultationId = searchParams.get("consultationId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const whereClause = {
    clinicId,
    ...(patientId ? { patientId } : {}),
  };

  const [labResults, imagingStudies] = await Promise.all([
    tenantPrisma.labResult.findMany({
      where: whereClause,
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    tenantPrisma.imagingStudy.findMany({
      where: whereClause,
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const formattedLab: DiagnosticResult[] = labResults.map((lr) => {
    const data = (lr.dataJson as Record<string, any>) || {};
    const testName = data.testName || "Análises Clínicas";
    const status: DiagnosticResult["status"] = lr.abnormalFlags
      ? "ALERT"
      : data.status === "PENDING"
      ? "PENDING"
      : "COMPLETED";

    return {
      id: lr.id,
      patientId: lr.patientId,
      patientName: lr.patient?.name ?? "—",
      ownerName: lr.patient?.owner?.name ?? "—",
      type: "LAB",
      source: lr.source || "Fuji DX-500",
      status,
      createdAt: lr.createdAt.toISOString(),
      summary: testName,
      testName: testName,
      dataJson: data,
      appointmentId: data.appointmentId,
      consultationId: data.consultationId,
    };
  });

  const formattedImaging: DiagnosticResult[] = imagingStudies.map((is) => {
    const meta = (is.metadataJson as Record<string, any>) || {};
    const testName = meta.testName || meta.studyDescription || "Exame de Imagem";
    const status: DiagnosticResult["status"] =
      is.dicomUrl === "pending" || meta.status === "PENDING" ? "PENDING" : "COMPLETED";

    return {
      id: is.id,
      patientId: is.patientId,
      patientName: is.patient?.name ?? "—",
      ownerName: is.patient?.owner?.name ?? "—",
      type: "IMAGING",
      source: meta.source || "Examion RX",
      status,
      createdAt: is.createdAt.toISOString(),
      summary: testName,
      testName: testName,
      metadataJson: meta,
      dicomUrl: is.dicomUrl,
      appointmentId: meta.appointmentId,
      consultationId: meta.consultationId,
    };
  });

  let allDiagnostics = [...formattedLab, ...formattedImaging].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (consultationId) {
    allDiagnostics = allDiagnostics.filter((d) => d.consultationId === consultationId);
  } else if (appointmentId) {
    allDiagnostics = allDiagnostics.filter((d) => d.appointmentId === appointmentId);
  }

  return NextResponse.json(allDiagnostics);
});
