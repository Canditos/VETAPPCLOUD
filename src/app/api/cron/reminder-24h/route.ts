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
  const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    const clinics = await prisma.clinic.findMany({
      include: {
        automationSettings: true,
      },
    });

    const results: any[] = [];

    for (const clinic of clinics) {
      if (!clinic.automationSettings?.reminder24h) continue;

      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId: clinic.id,
          startTime: { gte: tomorrowStart, lt: tomorrowEnd },
          status: "SCHEDULED",
        },
        include: {
          patient: { include: { owner: true } },
        },
      });

      for (const app of appointments) {
        const phone = app.patient.owner?.phone;
        const ownerName = app.patient.owner?.name || "Tutor";
        const patientName = app.patient.name;
        const time = app.startTime.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

        if (!phone) {
          results.push({ patient: patientName, status: "skipped", reason: "no phone" });
          continue;
        }

        const message = `Olá ${ownerName}, lembramos que o(a) ${patientName} tem uma consulta amanhã às ${time}. VetConnect`;

        try {
          await sendSMSViaRUT240(phone, message, clinic.id);
          await prisma.smsLog.create({
            data: {
              clinicId: clinic.id,
              phone,
              message,
              status: "SENT",
              type: "REMINDER_24H",
              patientId: app.patientId,
              ownerId: app.patient.ownerId,
              sentAt: new Date(),
            },
          });
          results.push({ patient: patientName, phone, status: "sent" });
        } catch (err: any) {
          await prisma.smsLog.create({
            data: {
              clinicId: clinic.id,
              phone,
              message,
              status: "FAILED",
              type: "REMINDER_24H",
              patientId: app.patientId,
              ownerId: app.patient.ownerId,
              error: err.message,
            },
          });
          results.push({ patient: patientName, phone, status: "failed", error: err.message });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error("[CRON_REMINDER_24H]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
