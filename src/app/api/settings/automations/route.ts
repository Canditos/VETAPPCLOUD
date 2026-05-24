import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    let settings = await prisma.automationSettings.findUnique({
      where: { clinicId }
    });

    if (!settings) {
      settings = await prisma.automationSettings.create({
        data: {
          clinicId,
          emailEnabled: true,
          smsEnabled: false,
          reminder24h: true,
          vaccineAlert: true,
          invoiceEmail: true,
          smsMarketing: false
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching automation settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withAuth(async ({ req, clinicId }) => {

  try {
    const body = await req.json();
    const { emailEnabled, smsEnabled, reminder24h, vaccineAlert, invoiceEmail, smsMarketing } = body;

    const settings = await prisma.automationSettings.upsert({
      where: { clinicId },
      update: {
        emailEnabled,
        smsEnabled,
        reminder24h,
        vaccineAlert,
        invoiceEmail,
        smsMarketing: smsMarketing ?? false
      },
      create: {
        clinicId,
        emailEnabled: emailEnabled ?? true,
        smsEnabled: smsEnabled ?? false,
        reminder24h: reminder24h ?? true,
        vaccineAlert: vaccineAlert ?? true,
        invoiceEmail: invoiceEmail ?? true,
        smsMarketing: smsMarketing ?? false
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating automation settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
