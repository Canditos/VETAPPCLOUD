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
import { getDicomConfig, setDicomConfig, getDicomStatus } from "@/lib/dicom";
import { z } from "zod";

const ConfigSchema = z.object({
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  rxAet: z.string().min(1).max(16).optional(),
  appAet: z.string().min(1).max(16).optional(),
  storePort: z.number().int().min(1).max(65535).optional(),
});

export const GET = withAuth(async ({ tenantPrisma, clinicId, userId }) => {
  // Check if user is admin
  const user = await tenantPrisma.user.findFirst({
    where: { id: userId, clinicId, role: { in: ["ADMIN", "OWNER"] } },
  });

  if (!user) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const status = await getDicomStatus();

  return NextResponse.json({
    currentConfig: getDicomConfig(),
    connectivity: status.connectivity,
    serverRunning: status.serverRunning,
    environment: status.environment,
  });
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, userId, req }) => {
  // Check if user is admin
  const user = await tenantPrisma.user.findFirst({
    where: { id: userId, clinicId, role: { in: ["ADMIN", "OWNER"] } },
  });

  if (!user) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const validation = ConfigSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  setDicomConfig(validation.data);
  
  // Test new config immediately
  const status = await getDicomStatus();

  return NextResponse.json({
    success: true,
    message: status.connectivity.success 
      ? "Configuração atualizada e RX online!" 
      : "Configuração atualizada, mas RX não responde.",
    newConfig: getDicomConfig(),
    connectivity: status.connectivity,
  });
});
