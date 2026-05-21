import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;

  try {
    let settings = await prisma.automationSettings.findUnique({
      where: { clinicId }
    });

    if (!settings) {
      settings = await prisma.automationSettings.create({
        data: { clinicId }
      });
    }

    return NextResponse.json({
      rut240Ip: settings.rut240Ip || "",
      rut240Port: settings.rut240Port || 80,
      rut240User: settings.rut240User || "",
      rut240Password: settings.rut240Password || "",
      rut240Enabled: settings.rut240Enabled || false,
    });
  } catch (error) {
    console.error("Error fetching RUT240 settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;

  try {
    const body = await req.json();
    const { rut240Ip, rut240Port, rut240User, rut240Password, rut240Enabled } = body;

    await prisma.automationSettings.upsert({
      where: { clinicId },
      update: {
        rut240Ip: rut240Ip || null,
        rut240Port: rut240Port ?? 80,
        rut240User: rut240User || null,
        rut240Password: rut240Password || null,
        rut240Enabled: rut240Enabled ?? false,
      },
      create: {
        clinicId,
        rut240Ip: rut240Ip || null,
        rut240Port: rut240Port ?? 80,
        rut240User: rut240User || null,
        rut240Password: rut240Password || null,
        rut240Enabled: rut240Enabled ?? false,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating RUT240 settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
