/**
 * API ROUTE: /api/health/integrations
 *
 * Responsabilidade: Verificar estado de conectividade de todas as
   * integrações de terceiros: Vendus, Jasmin, HL7, DICOM (Examion RX), e stock sync.
 *
 * Cache: Nenhum (cada request faz ping real). Considerar Redis
 *        se o volume de requests aumentar.
 *
 * Tenant: Sim — verifica configurações da clínica atual
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { getRxTargets } from "@/lib/gdt";
import fs from "fs";
import path from "path";

export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
  // DICOM — dynamic import, graceful fallback if module not available
  let testDicomConnection: any = null;
  let getDicomConfig: any = null;
  let startDicomStoreServer: any = null;
  try {
    const dicom = await import("@/lib/dicom");
    testDicomConnection = dicom.testDicomConnection;
    getDicomConfig = dicom.getDicomConfig;
    startDicomStoreServer = dicom.startDicomStoreServer;
    startDicomStoreServer();
  } catch { /* DICOM module not available */ }

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
        `https://www.vendus.pt/ws/v1.1/products/?api_key=${clinic.vendusApiKey}&per_page=1`,
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

  // HL7 / DICOM status
  const hl7Status = process.env.HL7_BRIDGE_URL ? "online" : "offline";
  
  // Test real DICOM connectivity to Examion RX
  let dicomStatus: "online" | "offline" | "error" = "offline";
  let dicomLabel = "DICOM Offline";
  if (testDicomConnection && (process.env.DICOM_PACS_HOST || process.env.DICOM_PACS_URL)) {
    try {
      const dicomResult = await testDicomConnection();
      dicomStatus = dicomResult.success ? "online" : "error";
      dicomLabel = dicomResult.success 
        ? `DICOM Ligado (${getDicomConfig().host}:${dicomResult.port})` 
        : `DICOM: ${dicomResult.message}`;
    } catch {
      dicomStatus = "error";
      dicomLabel = "DICOM Erro de Rede";
    }
  }

  // GDT status — check RX targets
  const gdtTargets = getRxTargets();
  const gdtOnline: string[] = [];
  for (const t of gdtTargets) {
    const p = path.join(t.mountPath, t.subdir);
    try {
      fs.accessSync(p, fs.constants.W_OK);
      gdtOnline.push(t.label);
    } catch { /* target offline */ }
  }
  const gdtStatus = gdtOnline.length > 0 ? "online"
    : gdtTargets.length > 0 ? "offline"
    : "not_configured";
  const gdtLabel = gdtOnline.length > 0
    ? `GDT RX Online (${gdtOnline.length})`
    : gdtTargets.length > 0
    ? "GDT RX Offline"
    : "GDT RX Não Configurado";

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
      label: dicomLabel,
    },
    gdt: {
      status: gdtStatus,
      label: gdtLabel,
      targets: gdtOnline,
    },
    checkedAt: new Date().toISOString(),
  });
});
