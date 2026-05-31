import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";
import { csrfProtection } from "@/lib/csrf";
import type { PrismaClient } from "@prisma/client";

export interface ApiContext {
  req: NextRequest;
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  tenantPrisma: PrismaClient;
  clinicId: string;
  userId: string;
}

export type ApiHandler = (ctx: ApiContext) => Promise<NextResponse> | NextResponse;

function withCsrf(handler: ApiHandler, req: NextRequest): Promise<NextResponse> | NextResponse {
  const csrf = csrfProtection(req);
  if (csrf) return csrf;
  return handler;
}

export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const csrf = csrfProtection(req);
      if (csrf) return csrf;

      const session = await getServerSession(authOptions);
      if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const clinicId = session.user.clinicId;
      const userId = session.user.id;
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
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

export type ApiHandlerWithParams<T = { id: string }> = (
  ctx: ApiContext,
  params: T
) => Promise<NextResponse> | NextResponse;

export function withAuthParams<T = { id: string }>(handler: ApiHandlerWithParams<T>) {
  return async (req: NextRequest, { params }: { params: Promise<T> }): Promise<NextResponse> => {
    try {
      const csrf = csrfProtection(req);
      if (csrf) return csrf;

      const session = await getServerSession(authOptions);
      if (!session?.user?.clinicId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const clinicId = session.user.clinicId;
      const userId = session.user.id;
      const tenantPrisma = getTenantClient(clinicId);
      const resolvedParams = await params;

      const ctx: ApiContext = {
        req,
        session: session as ApiContext["session"],
        tenantPrisma,
        clinicId,
        userId,
      };

      return await handler(ctx, resolvedParams);
    } catch (error) {
      console.error(`[API_ERROR] ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

export function withErrorHandler(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error(`[API_ERROR] ${req.method} ${req.url}`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}
