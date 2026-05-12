export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/portal/appointments — tutor requests an appointment (suggested, not free)
export async function POST(req: Request) {
  try {
    const { token, patientId, reason, preferred } = await req.json();

    if (!token || !patientId || !reason) {
      return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
    }

    const portalToken = await prisma.ownerPortalToken.findUnique({
      where: { token },
      include: { owner: true },
    });

    if (!portalToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verify patient belongs to this owner
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, ownerId: portalToken.ownerId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const request = await prisma.portalAppointmentRequest.create({
      data: {
        ownerId: portalToken.ownerId,
        clinicId: portalToken.clinicId,
        patientId,
        reason,
        preferred: preferred ?? null,
        status: "PENDING",
      },
    });

    // Create notification for the clinic
    await prisma.notification.create({
      data: {
        clinicId: portalToken.clinicId,
        type: "APPOINTMENT_REQUEST",
        title: `Pedido de marcação — ${portalToken.owner.name}`,
        body: reason,
        link: "/dashboard/calendar",
        metadata: {
          requestId: request.id,
          ownerId: portalToken.ownerId,
          patientId,
          preferred: preferred ?? null,
        },
      },
    });

    return NextResponse.json({ success: true, id: request.id });
  } catch (error) {
    console.error("[PORTAL_APPOINTMENTS_POST]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
