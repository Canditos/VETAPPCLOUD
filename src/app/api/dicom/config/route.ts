/**
 * API ROUTE: /api/dicom/config
 *
 * Responsabilidade: Consultar e atualizar configuração DICOM em runtime
 * sem precisar de reiniciar o servidor.
 *
 * Tenant: Sim
 * Auth: Requer sessão (admin)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";

// DICOM module loaded lazily to avoid build/runtime failure when dcmjs-dimse is not installed
async function getDicomModule() {
  try {
    return await import("@/lib/dicom");
  } catch {
    return null;
  }
}

const ConfigSchema = z.object({
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  rxAet: z.string().min(1).max(16).optional(),
  appAet: z.string().min(1).max(16).optional(),
  storePort: z.number().int().min(1).max(65535).optional(),
});

export const GET = withAuth(async ({ tenantPrisma, clinicId, userId }) => {
  const user = await tenantPrisma.user.findFirst({
    where: { id: userId, clinicId, role: { in: ["ADMIN", "OWNER"] } },
  });

  if (!user) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const dicom = await getDicomModule();
  if (!dicom) {
    return NextResponse.json({ error: "DICOM module not available" }, { status: 503 });
  }

  const status = await dicom.getDicomStatus();

  return NextResponse.json({
    currentConfig: dicom.getDicomConfig(),
    connectivity: status.connectivity,
    serverRunning: status.serverRunning,
    environment: status.environment,
  });
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, userId, req }) => {
  const user = await tenantPrisma.user.findFirst({
    where: { id: userId, clinicId, role: { in: ["ADMIN", "OWNER"] } },
  });

  if (!user) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const dicom = await getDicomModule();
  if (!dicom) {
    return NextResponse.json({ error: "DICOM module not available" }, { status: 503 });
  }

  const body = await req.json();
  const validation = ConfigSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  dicom.setDicomConfig(validation.data);
  const status = await dicom.getDicomStatus();

  return NextResponse.json({
    success: true,
    message: status.connectivity.success 
      ? "Configuração atualizada e RX online!" 
      : "Configuração atualizada, mas RX não responde.",
    newConfig: dicom.getDicomConfig(),
    connectivity: status.connectivity,
  });
});
