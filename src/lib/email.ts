import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || "Clínica Veterinária";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || "noreply@gatoescondido.com";

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  (transporter as any).__from = `"${fromName}" <${fromEmail}>`;
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ sent: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { sent: false, error: "SMTP not configured" };

  try {
    await t.sendMail({
      from: (t as any).__from,
      to,
      subject,
      html,
      text,
    });
    return { sent: true };
  } catch (err: any) {
    console.error("[EMAIL] Failed to send:", err.message);
    return { sent: false, error: err.message };
  }
}

export function buildRgpdEmail(name: string, link: string, clinicName: string): string {
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
        <p style="color:#666;font-size:12px;">Se não conseguir clicar no botão, copie este link:<br><span style="color:#2563eb;">${link}</span></p>
        <p style="color:#666;font-size:12px;margin-top:24px;">Se não confirmar, poderá continuar a receber informações essenciais, mas algumas funcionalidades do portal poderão ficar limitadas.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:11px;text-align:center;">Obrigado,<br>A equipa da ${clinicName}</p>
      </div>
    </div>
  `;
}
