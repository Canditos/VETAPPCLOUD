export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function verifyWebhookSecret(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { patientId, testResults, abnormalFlags, clinicId: explicitClinicId } = body;

  if (!patientId || !testResults) {
    return NextResponse.json({ error: "Missing required fields (patientId, testResults)" }, { status: 400 });
  }

  try {
    // 1. Resolve patient and its clinic to ensure proper multi-tenant isolation
    let resolvedPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: patientId },
          { microchip: patientId },
          { name: { equals: patientId, mode: "insensitive" } },
        ],
      },
      select: { id: true, clinicId: true },
    });

    let targetClinicId = explicitClinicId || resolvedPatient?.clinicId;

    // 2. If patient is not found directly, find default or first active clinic
    if (!targetClinicId) {
      const defaultClinic = await prisma.clinic.findFirst({
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      targetClinicId = defaultClinic?.id;
    }

    if (!targetClinicId) {
      return NextResponse.json({ error: "No clinic configured for lab result ingestion" }, { status: 422 });
    }

    // If patient didn't exist, create an unassigned/placeholder record so lab data is never lost
    if (!resolvedPatient) {
      // Find or create default owner for unassigned lab imports
      let defaultOwner = await prisma.owner.findFirst({
        where: { clinicId: targetClinicId, name: "Laboratório Externo / Fuji" },
        select: { id: true },
      });

      if (!defaultOwner) {
        defaultOwner = await prisma.owner.create({
          data: {
            clinicId: targetClinicId,
            name: "Laboratório Externo / Fuji",
            phone: "000000000",
          },
          select: { id: true },
        });
      }

      resolvedPatient = await prisma.patient.create({
        data: {
          clinicId: targetClinicId,
          ownerId: defaultOwner.id,
          name: String(patientId).substring(0, 100),
          species: "CANINE",
          status: "ACTIVE",
        },
        select: { id: true, clinicId: true },
      });
    }

    const labResult = await prisma.labResult.create({
      data: {
        clinicId: targetClinicId,
        patientId: resolvedPatient.id,
        source: "FUJI",
        dataJson: testResults,
        abnormalFlags: Boolean(abnormalFlags),
      },
    });

    return NextResponse.json({
      success: true,
      labResultId: labResult.id,
      patientId: resolvedPatient.id,
      clinicId: targetClinicId,
    });
  } catch (error) {
    console.error("[FUJI_INGESTION_ERROR]", error);
    return NextResponse.json({ error: "Failed to ingest lab results" }, { status: 500 });
  }
}

