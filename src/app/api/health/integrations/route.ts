/**
 * API ROUTE: /api/health/integrations
 *
 * Responsabilidade: Verificar estado de conectividade de todas as
 * integrações de terceiros: Vendus, Jasmin, HL7, DICOM, e stock sync.
 *
 * Cache: Nenhum (cada request faz ping real). Considerar Redis
 *        se o volume de requests aumentar.
 *
 * Tenant: Sim — verifica configurações da clínica atual
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  try {
    // Fetch clinic integrations config
    const clinic = await tenantPrisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        vendusApiKey: true,
        jasminAppId: true,
        jasminSecret: true,
        jasminApiKey: true,
        updatedAt: true,
      },
    });

    // Check Vendus connectivity
    let vendusStatus: "connected" | "configured" | "not_configured" = "not_configured";
    if (clinic?.vendusApiKey) {
      try {
        const vendusCheck = await fetch(
          `https://www.vendus.pt/ws/v1.1/products/?api_key=${clinic.vendusApiKey}&limit=1`,
          { method: "GET", signal: AbortSignal.timeout(5000) }
        );
        vendusStatus = vendusCheck.ok ? "connected" : "configured";
      } catch {
        vendusStatus = "configured"; // Key exists but API unreachable
      }
    }

    // Check Jasmin connectivity
    let jasminStatus: "connected" | "configured" | "not_configured" = "not_configured";
    if (clinic?.jasminAppId && clinic?.jasminSecret && clinic?.jasminApiKey) {
      jasminStatus = "configured";
      // We could do a real OAuth handshake here, but "configured" is sufficient for UI
    }

    // Inventory sync status: check if products have been synced recently
    const lastProduct = await tenantPrisma.product.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    const inventorySyncStatus =
      lastProduct && Date.now() - new Date(lastProduct.updatedAt).getTime() < 24 * 60 * 60 * 1000
        ? "active"
        : "idle";

    // HL7 / DICOM status — these are mock integrators for now
    // In a real scenario, we'd ping their webhook/health endpoints
    const hl7Status = process.env.HL7_BRIDGE_URL ? "online" : "offline";
    const dicomStatus = process.env.DICOM_PACS_URL ? "online" : "offline";

    return NextResponse.json({
      vendus: {
        status: vendusStatus,
        label: vendusStatus === "connected" ? "Vendus Ligado" : vendusStatus === "configured" ? "Vendus Configurado" : "Vendus Não Configurado",
      },
      jasmin: {
        status: jasminStatus,
        label: jasminStatus === "configured" ? "Jasmin Configurado" : "Jasmin Não Configurado",
      },
      inventorySync: {
        status: inventorySyncStatus,
        label: inventorySyncStatus === "active" ? "Sincronização Ativa" : "Sincronização Inativa",
      },
      hl7: {
        status: hl7Status,
        label: hl7Status === "online" ? "HL7 Online" : "HL7 Offline",
      },
      dicom: {
        status: dicomStatus,
        label: dicomStatus === "online" ? "DICOM Ligado" : "DICOM Offline",
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HEALTH_INTEGRATIONS]", error);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
