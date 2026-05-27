import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";
import { csrfProtection } from "@/lib/csrf";
import { canAccess, type CrudLevel, type Resource } from "@/lib/roles";
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

type SessionUser = {
  id?: string;
  clinicId?: string;
  email?: string;
  name?: string;
  role?: string;
};

function asSessionUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const csrf = csrfProtection(req);
      if (csrf) return csrf;

      const session = await getServerSession(authOptions);
      const sessionUser = asSessionUser(session);
      if (!sessionUser?.clinicId || !sessionUser.id || !sessionUser.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const clinicId = sessionUser.clinicId;
      const userId = sessionUser.id;
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

export function withRole(resource: Resource, level: CrudLevel, handler: ApiHandler) {
  return withAuth(async (ctx) => {
    const role = (ctx.session.user as { role?: string }).role;
    if (!canAccess(resource, role, level)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(ctx);
  });
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
      const sessionUser = asSessionUser(session);
      if (!sessionUser?.clinicId || !sessionUser.id || !sessionUser.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const clinicId = sessionUser.clinicId;
      const userId = sessionUser.id;
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

export function withRoleParams<T = { id: string }>(resource: Resource, level: CrudLevel, handler: ApiHandlerWithParams<T>) {
  return withAuthParams<T>(async (ctx, params) => {
    const role = (ctx.session.user as { role?: string }).role;
    if (!canAccess(resource, role, level)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(ctx, params);
  });
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
