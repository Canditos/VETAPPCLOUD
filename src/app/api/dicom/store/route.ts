/**
 * API ROUTE: /api/dicom/store
 *
 * Receives DICOM images from Examion RX via C-STORE
 * Stores imaging studies in the database
 *
 * Tenant: Sim
 * Auth: Requer sessão (para listar studies)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
  // List pending/received imaging studies
  const studies = await tenantPrisma.imagingStudy.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ studies });
});
