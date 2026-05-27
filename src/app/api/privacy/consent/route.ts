import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withRole } from "@/lib/api-wrapper";
import { z } from "zod";

const consentBodySchema = z.object({
  ownerId: z.string().min(1),
  version: z.string().min(1).optional(),
  ip: z.string().min(1).optional(),
  method: z.string().min(1).optional(),
});

export const GET = withRole("owners", "LER", async ({ req, clinicId, tenantPrisma }) => {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

  const consents = await tenantPrisma.privacyConsent.findMany({
    where: { ownerId, clinicId },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return NextResponse.json(consents[0] || null);
});

export const POST = withRole("owners", "CRIAR_LER", async ({ req, clinicId, tenantPrisma }) => {
  const parsed = consentBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { ownerId, version, ip, method } = parsed.data;
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
