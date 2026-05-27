import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withRole } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";
import { sendEmail, buildRgpdEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const inviteBodySchema = z.object({
  ownerId: z.string().min(1),
});

export const POST = withRole("owners", "CRIAR_LER", async ({ req, clinicId }) => {
  try {
    const parsed = inviteBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { ownerId } = parsed.data;
    if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId, clinicId },
      include: { clinic: { select: { name: true } } },
    });
    if (!owner) return NextResponse.json({ error: "Owner not found" }, { status: 404 });

    const existingConsent = await prisma.privacyConsent.findFirst({
      where: { ownerId, clinicId, accepted: true },
    });
    if (existingConsent) {
      return NextResponse.json({ error: "Cliente já aceitou a política de privacidade" }, { status: 409 });
    }

    const tokenValue = crypto.randomUUID();
    await prisma.ownerPortalToken.create({
      data: {
        token: tokenValue,
        ownerId,
        clinicId,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://vet.gatoescondido.com";
    const consentLink = `${baseUrl}/api/portal/auth/magic?token=${tokenValue}&redirect=/portal/privacy`;
    const clinicName = owner.clinic?.name || "Clínica Veterinária";

    const sent: string[] = [];

    if (owner.email) {
      const { sent: ok } = await sendEmail(
        owner.email,
        "Proteção de Dados Pessoais – Confirmação de Consentimento",
        buildRgpdEmail(owner.name, consentLink, clinicName)
      );
      if (ok) sent.push("email");
    }

    if (sent.length === 0 && owner.phone) {
      try {
        const msg = `RGPD - Confirme a sua Politica de Privacidade: ${consentLink}`;
        await sendSMSViaRUT240(owner.phone, msg, clinicId);
        sent.push("sms");
      } catch {}
    }

    return NextResponse.json({
      sent,
      message: sent.includes("email")
        ? `Email enviado para ${owner.email}`
        : sent.includes("sms")
          ? `SMS enviado para ${owner.phone}`
          : "Não foi possível enviar. Copie o link e envie manualmente.",
    });
  } catch (error) {
    console.error("[PRIVACY_SEND_INVITE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
