import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  try {
    const clinics = await prisma.clinic.findMany({
      include: { automationSettings: true },
    });

    const results: any[] = [];

    for (const clinic of clinics) {
      if (!clinic.automationSettings?.vaccineAlert) continue;

      const vaccinations = await prisma.vaccination.findMany({
        where: {
          expiresAt: {
            gte: now,
            lte: in15Days,
          },
          patient: { clinicId: clinic.id },
        },
        include: {
          patient: { include: { owner: true } },
        },
      });

      for (const vax of vaccinations) {
        const phone = vax.patient.owner?.phone;
        const ownerName = vax.patient.owner?.name || "Tutor";
        const patientName = vax.patient.name;

        if (!phone) {
          results.push({ patient: patientName, vaccine: vax.vaccineName, status: "skipped", reason: "no phone" });
          continue;
        }

        const message = `Olá ${ownerName}, a vacina ${vax.vaccineName} do(a) ${patientName} expira em breve. Agende já o reforço! VetConnect`;

        try {
          await sendSMSViaRUT240(phone, message, clinic.id);
          await prisma.smsLog.create({
            data: {
              clinicId: clinic.id,
              phone,
              message,
              status: "SENT",
              type: "VACCINE_ALERT",
              patientId: vax.patientId,
              ownerId: vax.patient.ownerId,
              sentAt: new Date(),
            },
          });
          results.push({ patient: patientName, vaccine: vax.vaccineName, phone, status: "sent" });
        } catch (err: any) {
          await prisma.smsLog.create({
            data: {
              clinicId: clinic.id,
              phone,
              message,
              status: "FAILED",
              type: "VACCINE_ALERT",
              patientId: vax.patientId,
              ownerId: vax.patient.ownerId,
              error: err.message,
            },
          });
          results.push({ patient: patientName, vaccine: vax.vaccineName, phone, status: "failed", error: err.message });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error("[CRON_VACCINE_ALERT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
