import { NextResponse } from "next/server";
import twilio from "twilio";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";
<<<<<<< HEAD
import prisma from "@/lib/prisma";
=======
import { withAuth } from "@/lib/api-wrapper";
>>>>>>> 0ef987b (refactor: api-wrapper withAuth/withAuthParams for all routes + portal rate limiting + debug route gating)

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

<<<<<<< HEAD
async function logSms(clinicId: string, phone: string, message: string, status: string, type: string, error?: string, patientId?: string, ownerId?: string) {
  try {
    await prisma.smsLog.create({
      data: { clinicId, phone, message, status, type, error, patientId, ownerId, sentAt: status === "SENT" ? new Date() : null }
    });
  } catch { /* silent */ }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clinicId = (session?.user as any)?.clinicId;

    const { appointmentId, type, patientName, ownerPhone, message, patientId, ownerId, logType } = await req.json();
=======
export const POST = withAuth(async ({ req, clinicId }) => {
  try {
    const { appointmentId, type, patientName, ownerPhone, message } = await req.json();
>>>>>>> 0ef987b (refactor: api-wrapper withAuth/withAuthParams for all routes + portal rate limiting + debug route gating)

    const smsMessage = message || `Olá! Lembramos a sua consulta para ${patientName}. VetConnect.`;

    if (type === 'SMS' && ownerPhone) {
      // 1. Try RUT240 Gateway (reads from DB config or env vars)
      try {
        await sendSMSViaRUT240(ownerPhone, smsMessage, clinicId);
        await logSms(clinicId, ownerPhone, smsMessage, "SENT", logType || "MANUAL", undefined, patientId, ownerId);
        return NextResponse.json({ success: true, message: "SMS enviado via Router RUT240." });
      } catch (rutError: any) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[RUT240 ERROR]", rutError.message);
        }
      }

      // 2. Fallback to Twilio
      if (client && twilioNumber) {
        try {
          let cleanPhone = ownerPhone.replace(/\s+/g, '');
          if (!cleanPhone.startsWith('+')) {
            cleanPhone = `+351${cleanPhone}`;
          }

          await client.messages.create({
            body: smsMessage,
            from: twilioNumber,
            to: cleanPhone,
          });
          await logSms(clinicId, ownerPhone, smsMessage, "SENT", logType || "MANUAL", undefined, patientId, ownerId);
          return NextResponse.json({ success: true, message: "SMS enviado via Twilio." });
        } catch (twError: any) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[TWILIO ERROR]", twError.message);
          }
        }
      }

      // 3. Mock Fallback
      if (process.env.NODE_ENV !== "production") {
        console.log(`[NOTIFICATION MOCK] ${smsMessage}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      await logSms(clinicId, ownerPhone, smsMessage, "SENT", logType || "MANUAL", undefined, patientId, ownerId);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[NOTIFICATION MOCK] Sending ${type} to ${ownerPhone}`);
      }
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'SMS' ? 'SMS (Demo)' : 'Notificação'} processada.`
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[NOTIFICATION ERROR]", error);
    }
    return NextResponse.json({ error: "Erro ao processar notificação" }, { status: 500 });
  }
});
