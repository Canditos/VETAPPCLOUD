export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma, clinicId }, { id }) => {
  const request = await tenantPrisma.portalAppointmentRequest.findFirst({
    where: {
      id,
      clinicId,
    },
    include: {
      patient: {
        include: {
          owner: true,
        },
      },
      owner: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Appointment request not found" }, { status: 404 });
  }

  return NextResponse.json(request);
});
