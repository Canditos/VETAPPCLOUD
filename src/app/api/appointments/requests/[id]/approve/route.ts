export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const POST = withAuthParams(async ({ tenantPrisma, clinicId, userId, req }, { id }) => {
  const body = await req.json();
  const request = await tenantPrisma.portalAppointmentRequest.findFirst({
    where: {
      id,
      clinicId,
    },
    include: {
      patient: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Appointment request not found" }, { status: 404 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Appointment request is not pending" }, { status: 400 });
  }

  const { veterinarianId, startTime } = body as { veterinarianId: string; startTime?: string };

  if (!veterinarianId) {
    return NextResponse.json({ error: "veterinarianId is required" }, { status: 400 });
  }

  const vet = await tenantPrisma.user.findFirst({
    where: {
      id: veterinarianId,
      clinicId,
    },
  });

  if (!vet) {
    return NextResponse.json({ error: "Veterinarian not found" }, { status: 404 });
  }

  const start = startTime ? new Date(startTime) : new Date();
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const appointment = await tenantPrisma.appointment.create({
    data: {
      clinicId,
      patientId: request.patientId,
      veterinarianId,
      startTime: start,
      endTime: end,
      type: "CONSULTATION",
      reason: request.reason,
      status: "SCHEDULED",
    },
  });

  await tenantPrisma.portalAppointmentRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  return NextResponse.json({
    message: "Appointment request approved",
    appointment,
  });
});
