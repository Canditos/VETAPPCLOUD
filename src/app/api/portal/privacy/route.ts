export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPortalSession } from "@/lib/auth-portal";
import { z } from "zod";

const bodySchema = z.object({
  version: z.string().min(1).optional(),
  policyUrl: z.string().min(1).optional(),
  ip: z.string().min(1).optional(),
  userAgent: z.string().min(1).optional(),
});

export const GET = withPortalSession(async ({ portalSession }) => {
  const { ownerId, clinicId } = portalSession;

  const consent = await prisma.privacyConsent.findFirst({
    where: { ownerId, clinicId, accepted: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accepted: !!consent, consent });
});

export const POST = withPortalSession(async ({ req, portalSession }) => {
  const { ownerId, clinicId } = portalSession;

  const parsedBody = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsedBody.error.flatten() }, { status: 400 });
  }
  const body = parsedBody.data;

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
});
