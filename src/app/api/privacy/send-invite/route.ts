import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";
import { SignJWT } from "jose";

export const POST = withAuth(async ({ req, clinicId }: any) => {
  try {
    const { ownerId, method } = await req.json();
    if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId, clinicId },
    });
    if (!owner) return NextResponse.json({ error: "Owner not found" }, { status: 404 });

    const existingConsent = await prisma.privacyConsent.findFirst({
      where: { ownerId, clinicId, accepted: true },
    });
    if (existingConsent) {
      return NextResponse.json({ error: "Cliente já aceitou a política de privacidade" }, { status: 409 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const portalJwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const baseUrl = process.env.NEXTAUTH_URL || "https://vet.gatoescondido.com";
    const consentLink = `${baseUrl}/api/portal/auth/magic?token=${portalJwt}&redirect=/portal/privacy`;

    const sent: string[] = [];

    if (owner.phone) {
      try {
        const msg = `RGPD - Confirme a sua Política de Privacidade: ${consentLink}`;
        await sendSMSViaRUT240(owner.phone, msg, clinicId);
        sent.push("sms");
      } catch {}
    }

    if (owner.email) {
      try {
        await prisma.owner.update({
          where: { id: ownerId },
          data: { notes: `${owner.notes || ""}\n[Convite RGPD enviado para ${owner.email}]` },
        });
      } catch {}
    }

    return NextResponse.json({
      sent,
      link: consentLink,
      message: sent.length > 0
        ? `Convite enviado por SMS para ${owner.phone}`
        : "Cliente não tem telefone. Copie o link abaixo e envie manualmente.",
    });
  } catch (error) {
    console.error("[PRIVACY_SEND_INVITE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
