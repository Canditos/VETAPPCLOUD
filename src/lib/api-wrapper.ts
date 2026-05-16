/**
 * ============================================
 * API ROUTE WRAPPER
 * ============================================
 *
 * Padroniza o tratamento de:
 * - Autenticação (getServerSession)
 * - Multi-tenancy (getTenantClient)
 * - Erros (catch global)
 * - Logging
 *
 * TODAS as API routes devem usar este wrapper.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { Session } from "next-auth";

export interface ApiContext {
  req: NextRequest;
  session: Session & { user: { id: string; clinicId: string; email: string; name?: string; role?: string } };
  tenantPrisma: PrismaClient;
  clinicId: string;
  userId: string;
}

export type ApiHandler = (ctx: ApiContext) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper para API routes GET/POST/PUT/PATCH/DELETE
 *
 * @example
 * // src/app/api/patients/route.ts
 * import { withAuth } from "@/lib/api-wrapper";
 *
 * export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
 *   const patients = await tenantPrisma.patient.findMany({ where: { clinicId } });
 *   return NextResponse.json(patients);
 * });
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !(session.user as any).clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const clinicId = (session.user as any).clinicId as string;
      const userId = (session.user as any).id as string;
      const tenantPrisma = getTenantClient(clinicId);

      const ctx: ApiContext = {
        req,
        session: session as ApiContext["session"],
        tenantPrisma,
        clinicId,
        userId,
      };

      return await handler(ctx);
    } catch (error) {
      console.error(`[API_ERROR] ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper para rotas públicas (sem autenticação).
 * Usar com cuidado — apenas para webhooks e auth callbacks.
 */
export function withErrorHandler(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error(`[API_ERROR] ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  };
}
