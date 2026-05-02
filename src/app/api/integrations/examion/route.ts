import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook for Examion RX Imaging Studies
 */
export async function POST(req: Request) {
  const body = await req.json();

  const { patientId, dicomUrl, metadata } = body;

  if (!patientId || !dicomUrl) {
    return NextResponse.json({ error: "Invalid study data" }, { status: 400 });
  }

  try {
    const study = await prisma.imagingStudy.create({
      data: {
        patientId,
        dicomUrl,
        metadataJson: metadata || {},
      },
    });

    return NextResponse.json({ success: true, studyId: study.id });
  } catch (error) {
    console.error("Imaging Ingestion Error:", error);
    return NextResponse.json({ error: "Failed to link imaging study" }, { status: 500 });
  }
}
