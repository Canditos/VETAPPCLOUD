export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vet_portal_session")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { ownerId: payload.ownerId as string, clinicId: payload.clinicId as string };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { ownerId, clinicId } = session;

  const consent = await prisma.privacyConsent.findFirst({
    where: { ownerId, clinicId, accepted: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accepted: !!consent, consent });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { ownerId, clinicId } = session;

  const body = await req.json().catch(() => ({}));

  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host") || "vet.gatoescondido.com"}`;

  const consent = await prisma.privacyConsent.create({
    data: {
      ownerId,
      clinicId,
      version: body.version || "v1",
      policyUrl: body.policyUrl || `${baseUrl}/portal/privacy`,
      ip: body.ip || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      userAgent: body.userAgent || req.headers.get("user-agent") || null,
      method: "portal",
      accepted: true,
      acceptedAt: new Date(),
    },
  });

  return NextResponse.json(consent);
}
