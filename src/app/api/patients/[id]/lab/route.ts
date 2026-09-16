export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ tenantPrisma }, { id: patientId }) => {
  try {
    const patient = await tenantPrisma.patient.findFirst({ where: { id: patientId } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const labResults = await tenantPrisma.labResult.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(labResults);
  } catch (error) {
    console.error("[PATIENT_LAB_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
