import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ tenantPrisma }) => {
  try {
    const hospitalizations = await tenantPrisma.hospitalization.findMany({
      where: { status: "ADMITTED" },
      include: {
        patient: { include: { owner: true } },
        admissionBy: { select: { name: true } },
        tasks: {
          orderBy: { scheduledTime: "asc" },
          include: { completedBy: { select: { name: true } } },
        },
      },
      orderBy: { admissionDate: "asc" },
    });

    return NextResponse.json(hospitalizations);
  } catch (error) {
    console.error("[HOSPITALIZATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const POST = withAuth(async ({ req, tenantPrisma, userId }) => {
  try {
    const body = await req.json();

    if (!body.patientId || !body.reason) {
      return NextResponse.json({ error: "patientId e reason são obrigatórios" }, { status: 400 });
    }

    const hospitalization = await tenantPrisma.hospitalization.create({
      data: {
        patientId: body.patientId,
        boxNumber: body.boxNumber,
        reason: body.reason,
        admissionById: userId,
        status: "ADMITTED",
      },
    });

    return NextResponse.json(hospitalization);
  } catch (error) {
    console.error("[HOSPITALIZATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
