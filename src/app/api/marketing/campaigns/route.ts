import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";
import { sendSMSViaRUT240 } from "@/lib/sms-rut240";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().min(1),
  ownerIds: z.array(z.string().min(1)).min(1),
});

export const POST = withRole("marketing", "CRIAR_LER", async ({ req, clinicId }) => {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { message, ownerIds } = parsed.data;

    const settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
    if (!settings?.smsMarketing) {
      return NextResponse.json({ error: "Envio de SMS marketing está desativado. Ative em Notificações." }, { status: 403 });
    }

    const owners = await prisma.owner.findMany({
      where: { id: { in: ownerIds }, clinicId, phone: { not: null } },
    });

    const results: Array<{ ownerId: string; name: string; phone: string; status: "sent" | "failed"; error?: string }> = [];

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
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        await prisma.smsLog.create({
          data: {
            clinicId,
            phone: owner.phone,
            message,
            status: "FAILED",
            type: "MARKETING",
            ownerId: owner.id,
            error: errMessage,
          },
        });
        results.push({ ownerId: owner.id, name: owner.name, phone: owner.phone, status: "failed", error: errMessage });
      }
    }

    return NextResponse.json({ success: true, sent: results.filter((r) => r.status === "sent").length, failed: results.filter((r) => r.status === "failed").length, results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("[MARKETING]", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
