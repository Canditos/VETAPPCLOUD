export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

// GET — list pending appointment requests for this clinic
export const GET = withAuth(async ({ clinicId }) => {
  try {
    const requests = await prisma.portalAppointmentRequest.findMany({
      where: { clinicId, status: "PENDING" },
      include: {
        owner: { select: { name: true, phone: true } },
        patient: { select: { name: true, species: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});

// PATCH — confirm or reject a request
export const PATCH = withAuth(async ({ req, clinicId }) => {
  try {
    const { id, status, notes } = await req.json();

    const existing = await prisma.portalAppointmentRequest.findFirst({
      where: { id, clinicId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.portalAppointmentRequest.update({
      where: { id },
      data: { status, notes: notes ?? undefined },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
