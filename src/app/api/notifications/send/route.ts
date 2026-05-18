import { NextResponse } from "next/server";
import twilio from "twilio";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// RUT240 Config check
const useRUT240 = !!process.env.RUT240_IP;

export async function POST(req: Request) {
  try {
    const { appointmentId, type, patientName, ownerPhone, message } = await req.json();

    const smsMessage = message || `Olá! Lembramos a sua consulta para ${patientName}. VetConnect.`;

    if (type === 'SMS' && ownerPhone) {
      // 1. Try RUT240 Gateway (Local Router)
      if (useRUT240) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[GATEWAY] Using RUT240 for ${ownerPhone}`);
        }
        try {
          await sendSMSViaRUT240(ownerPhone, smsMessage);
          return NextResponse.json({ success: true, message: "SMS enviado via Router RUT240." });
        } catch (rutError: any) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[RUT240 ERROR]", rutError.message);
          }
          // If RUT240 fails, we can fallback to Twilio if available
        }
      }

      // 2. Fallback to Twilio
      if (client && twilioNumber) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[TWILIO] Sending SMS to ${ownerPhone} via ${twilioNumber}`);
        }
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
    } else {
      // Mock for Email or other types
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
}
