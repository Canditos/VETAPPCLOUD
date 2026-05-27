import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPortalSession } from "@/lib/auth-portal";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1).optional(),
  patientId: z.string().min(1),
  reason: z.string().min(1),
  preferred: z.string().optional().nullable(),
});

// POST /api/portal/appointments — tutor requests an appointment (suggested, not free)
export const POST = withPortalSession(async ({ req, portalSession }) => {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { token, patientId, reason, preferred } = parsed.data;

    let ownerId: string;
    let clinicId: string;
    let ownerName: string;

    if (token) {
      const portalToken = await prisma.ownerPortalToken.findUnique({
        where: { token },
        include: { owner: true },
      });

      if (!portalToken) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
      ownerId = portalToken.ownerId;
      clinicId = portalToken.clinicId;
      if (portalToken.owner.clinicId !== clinicId) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
      ownerName = portalToken.owner.name;
    } else {
      ownerId = portalSession.ownerId;
      clinicId = portalSession.clinicId;
      
      const owner = await prisma.owner.findFirst({ where: { id: ownerId, clinicId } });
      if (!owner) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      ownerName = owner.name;
    }

    if (!patientId || !reason) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
    }

    // Verify patient belongs to this owner
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, ownerId, clinicId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const request = await prisma.portalAppointmentRequest.create({
      data: {
        ownerId,
        clinicId,
        patientId,
        reason,
        preferred: preferred ?? null,
        status: "PENDING",
      },
    });

    // Create notification for the clinic
    await prisma.notification.create({
      data: {
        clinicId,
        type: "APPOINTMENT",
        title: `Pedido de marcação — ${ownerName}`,
        message: reason,
        link: `/dashboard/appointments?requestId=${request.id}`,
        ownerId,
        requestId: request.id,
      },
    });

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    console.error("[PORTAL_APPOINTMENTS_POST]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
