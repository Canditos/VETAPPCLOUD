/**
 * API ROUTE: /api/diagnostics/export
 *
 * Responsabilidade: Exportar um lote de resultados diagnósticos
 * para um ficheiro CSV/JSON. Usado na página de Diagnósticos.
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
  const [labResults, imagingStudies] = await Promise.all([
    tenantPrisma.labResult.findMany({
      where: { clinicId },
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    tenantPrisma.imagingStudy.findMany({
      where: { clinicId },
      include: { patient: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const allDiagnostics = [
    ...labResults.map((lr) => ({
      id: lr.id,
      tipo: "LAB",
      paciente: lr.patient?.name ?? "—",
      tutor: lr.patient?.owner?.name ?? "—",
      fonte: lr.source,
      estado: lr.abnormalFlags ? "ALERTA" : "RECEBIDO",
      data: lr.createdAt.toISOString(),
      resumo: (lr.dataJson as { testName?: string })?.testName ?? "Análises",
    })),
    ...imagingStudies.map((is) => ({
      id: is.id,
      tipo: "IMAGING",
      paciente: is.patient?.name ?? "—",
      tutor: is.patient?.owner?.name ?? "—",
      fonte: "Examion RX",
      estado: "RECEBIDO",
      data: is.createdAt.toISOString(),
      resumo: (is.metadataJson as { studyDescription?: string })?.studyDescription ?? "Imagem",
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Gera CSV
  const headers = ["ID", "Tipo", "Paciente", "Tutor", "Fonte", "Estado", "Data", "Resumo"];
  const rows = allDiagnostics.map((d) =>
    [d.id, d.tipo, d.paciente, d.tutor, d.fonte, d.estado, d.data, d.resumo].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnosticos_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
});
