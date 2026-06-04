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
  const body = await req.json();

  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    return NextResponse.json({ success: true, labResultId: labResult.id });
  } catch (error) {
    console.error("Lab Ingestion Error:", error);
    return NextResponse.json({ error: "Failed to ingest lab results" }, { status: 500 });
  }
}
