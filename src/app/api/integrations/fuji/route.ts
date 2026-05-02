export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook for Fuji Lab Results
 * Expected payload: { patientId, clinicId, testResults: [...], abnormalFlags: boolean }
 */
export async function POST(req: Request) {
  // In a real scenario, we'd verify a shared secret or Fuji certificate here
  const body = await req.json();

  const { patientId, testResults, abnormalFlags } = body;

  if (!patientId || !testResults) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const labResult = await prisma.labResult.create({
      data: {
        patientId,
        source: "FUJI",
        dataJson: testResults,
        abnormalFlags: abnormalFlags || false,
      },
    });

    // Optional: Trigger notification to veterinarian
    return NextResponse.json({ success: true, labResultId: labResult.id });
  } catch (error) {
    console.error("Lab Ingestion Error:", error);
    return NextResponse.json({ error: "Failed to ingest lab results" }, { status: 500 });
  }
}
