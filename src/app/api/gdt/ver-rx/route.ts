/**
 * API ROUTE: POST /api/gdt/ver-rx
 *
 * Responsabilidade: Gerar ficheiro GDT 6311 ("Ver RX").
 * Escreve automaticamente na pasta gdtin (Samba share) para o Examion ler.
 * Tambem devolve o ficheiro para download.
 *
 * Tenant: Sim
 * Auth: Requer sessao
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";
import { autoSendViewer } from "@/lib/gdt";

const Schema = z.object({
  patientId: z.string().min(1),
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  const body = await req.json();
  const validation = Schema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { patientId } = validation.data;

  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado" }, { status: 404 });
  }

  const result = autoSendViewer({
    patientId: patient.id.substring(0, 10),
    patientName: patient.name,
    species: patient.species,
  });

  const gdtContent = result.written ? undefined : result.buffer.toString("base64");

  return NextResponse.json({
    success: true,
    message: result.written
      ? `Ficheiro enviado para ${result.target || "Examion"} (${result.path})`
      : "Nenhum PC RX online. Ficheiro pronto para download manual.",
    written: result.written,
    target: result.target,
    path: result.path,
    filename: result.filename,
    encoding: result.encoding,
    attempts: result.rxAttempts,
    gdtContent,
  });
});
