import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";
import { SignJWT } from "jose";

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) return false;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return false;

    const transporter = nodemailer.default.createTransport({
      host, port, secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Clínica Veterinária" <${user}>`,
      to, subject, html,
    });
    return true;
  } catch {
    return false;
  }
}

function buildEmailHtml(name: string, link: string, clinicName: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1e3a5f;border-radius:16px;padding:32px;text-align:center;color:#fff;">
        <h1 style="margin:0;font-size:20px;">Proteção de Dados Pessoais</h1>
        <p style="opacity:0.8;margin-top:8px;">Confirmação de Consentimento — RGPD</p>
      </div>
      <div style="padding:32px 0;color:#333;line-height:1.6;">
        <p>Olá <strong>${name}</strong>,</p>
        <p>Na <strong>${clinicName}</strong>, tratamos os seus dados pessoais e os dados do seu animal de companhia de acordo com o Regulamento Geral sobre a Proteção de Dados (RGPD).</p>
        <p>Pode consultar a nossa Política de Privacidade no link abaixo.</p>
        <p>Para continuar a utilizar os nossos serviços e gerir a sua ficha de cliente, pedimos que confirme que leu e compreendeu esta informação.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
            Confirmar e Aceitar
          </a>
        </div>
        <p style="color:#666;font-size:12px;">Se não conseguir clicar no botão, copie este link para o seu navegador:<br><span style="color:#2563eb;">${link}</span></p>
        <p style="color:#666;font-size:12px;margin-top:24px;">Se não confirmar, poderá continuar a receber informações essenciais relativas aos serviços clínicos do seu animal, mas algumas funcionalidades do portal poderão ficar limitadas.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:11px;text-align:center;">Obrigado,<br>A equipa da ${clinicName}</p>
      </div>
    </div>
  `;
}

export const POST = withAuth(async ({ req, clinicId }: any) => {
  try {
    const { ownerId } = await req.json();
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

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const portalJwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const baseUrl = process.env.NEXTAUTH_URL || "https://vet.gatoescondido.com";
    const consentLink = `${baseUrl}/api/portal/auth/magic?token=${portalJwt}&redirect=/portal/privacy`;
    const clinicName = owner.clinic?.name || "Clínica Veterinária";

    let sent: string[] = [];

    // 1. Email primeiro (com template RGPD completo)
    if (owner.email) {
      const ok = await sendEmail(
        owner.email,
        "Proteção de Dados Pessoais – Confirmação de Consentimento",
        buildEmailHtml(owner.name, consentLink, clinicName)
      );
      if (ok) sent.push("email");
    }

    // 2. Fallback SMS (só se não tem email ou email falhou)
    if (sent.length === 0 && owner.phone) {
      try {
        const msg = `RGPD - Confirme a sua Politica de Privacidade: ${consentLink}`;
        await sendSMSViaRUT240(owner.phone, msg, clinicId);
        sent.push("sms");
      } catch {}
    }

    return NextResponse.json({
      sent,
      link: consentLink,
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
