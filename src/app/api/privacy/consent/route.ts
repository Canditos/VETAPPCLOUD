import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (ctx: any) => {
  const { req, clinicId, tenantPrisma } = ctx;
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const consents = await tenantPrisma.privacyConsent.findMany({
    where: { ownerId, clinicId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return NextResponse.json(consents[0] || null);
});

export const POST = withAuth(async (ctx: any) => {
  const { req, clinicId, tenantPrisma } = ctx;
  const body = await req.json();
  const { ownerId, version, ip, method } = body;
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const consent = await tenantPrisma.privacyConsent.create({
    data: {
      ownerId,
      clinicId,
      version: version || "v1",
      ip: ip || req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip") || null,
      method: method || "portal",
      accepted: true,
      acceptedAt: new Date(),
    },
  });
  return NextResponse.json(consent);
});
