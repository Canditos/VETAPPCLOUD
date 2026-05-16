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

export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
  const [labResults, imagingStudies] = await Promise.all([
    tenantPrisma.labResult.findMany({
      where: { clinicId },
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    tenantPrisma.imagingStudy.findMany({
      where: { clinicId },
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedLab: DiagnosticResult[] = labResults.map((lr) => ({
    id: lr.id,
    patientId: lr.patientId,
    patientName: lr.patient?.name ?? "—",
    ownerName: lr.patient?.owner?.name ?? "—",
    type: "LAB",
    source: lr.source,
    status: lr.abnormalFlags ? "ALERT" : "COMPLETED",
    createdAt: lr.createdAt.toISOString(),
    summary: (lr.dataJson as { testName?: string })?.testName ?? "Análises Clínicas",
  }));

  const formattedImaging: DiagnosticResult[] = imagingStudies.map((is) => ({
    id: is.id,
    patientId: is.patientId,
    patientName: is.patient?.name ?? "—",
    ownerName: is.patient?.owner?.name ?? "—",
    type: "IMAGING",
    source: "Examion RX",
    status: "COMPLETED",
    createdAt: is.createdAt.toISOString(),
    summary: (is.metadataJson as { studyDescription?: string })?.studyDescription ?? "Exame de Imagem",
  }));

  const allDiagnostics = [...formattedLab, ...formattedImaging].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(allDiagnostics);
});
