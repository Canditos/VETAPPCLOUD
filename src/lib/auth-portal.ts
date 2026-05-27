import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export type PortalSession = { ownerId: string; clinicId: string };

export async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vet_portal_session")?.value;

  if (!token) return null;

  try {
    if (!process.env.NEXTAUTH_SECRET) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as PortalSession;
  } catch {
    return null;
  }
}

type PortalHandler = (ctx: { req: Request; portalSession: PortalSession }) => Promise<NextResponse> | NextResponse;

export function withPortalSession(handler: PortalHandler) {
  return async (req: Request): Promise<NextResponse> => {
    const portalSession = await getPortalSession();
    if (!portalSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler({ req, portalSession });
  };
}

type PortalHandlerWithParams<T = { id: string }> = (
  ctx: { req: Request; portalSession: PortalSession },
  params: T
) => Promise<NextResponse> | NextResponse;

export function withPortalSessionParams<T = { id: string }>(handler: PortalHandlerWithParams<T>) {
  return async (req: Request, { params }: { params: Promise<T> }): Promise<NextResponse> => {
    const portalSession = await getPortalSession();
    if (!portalSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    return handler({ req, portalSession }, resolvedParams);
  };
}
