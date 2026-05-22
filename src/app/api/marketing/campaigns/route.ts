import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;

  try {
    const { message, ownerIds } = await req.json();
    if (!message || !ownerIds?.length) {
      return NextResponse.json({ error: "Mensagem e destinatários são obrigatórios" }, { status: 400 });
    }

    const settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
    if (!settings?.smsMarketing) {
      return NextResponse.json({ error: "Envio de SMS marketing está desativado. Ative em Notificações." }, { status: 403 });
    }

    const owners = await prisma.owner.findMany({
      where: { id: { in: ownerIds }, clinicId, phone: { not: null } },
    });

    const results: any[] = [];

    for (const owner of owners) {
      if (!owner.phone) continue;
      try {
        await sendSMSViaRUT240(owner.phone, message, clinicId);
        await prisma.smsLog.create({
          data: {
            clinicId,
            phone: owner.phone,
            message,
            status: "SENT",
            type: "MARKETING",
            ownerId: owner.id,
            sentAt: new Date(),
          },
        });
        results.push({ ownerId: owner.id, name: owner.name, phone: owner.phone, status: "sent" });
      } catch (err: any) {
        await prisma.smsLog.create({
          data: {
            clinicId,
            phone: owner.phone,
            message,
            status: "FAILED",
            type: "MARKETING",
            ownerId: owner.id,
            error: err.message,
          },
        });
        results.push({ ownerId: owner.id, name: owner.name, phone: owner.phone, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({ success: true, sent: results.filter((r) => r.status === "sent").length, failed: results.filter((r) => r.status === "failed").length, results });
  } catch (error: any) {
    console.error("[MARKETING]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
