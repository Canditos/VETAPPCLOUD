export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);
  const body = await req.json();

  const { 
    patientId, 
    consultationId, 
    type, 
    source, 
    items 
  } = body;

  try {
    // 1. Create a Diagnostic Request in the DB
    // Depending on the type, it would create a record in LabResult (pending) or ImagingStudy (pending)
    let record;

    if (type === "LAB") {
      record = await tenantPrisma.labResult.create({
        data: {
          patientId,
          consultationId,
          source, // e.g., "Fuji DX-500"
          status: "PENDING",
          rawHL7: `MSH|^~\\&|VETCONNECT|${clinicId}|FUJI|LAB|...`, // Mocking HL7 header
        }
      });

      // Here we would trigger the HL7 message sending to the local analyzer via MQTT or TCP Bridge
      console.log(`[INTEGRATION] Sending HL7 Request to ${source} for patient ${patientId}`);
    } else if (type === "IMAGING") {
      record = await tenantPrisma.imagingStudy.create({
        data: {
          patientId,
          consultationId,
          type: "XRAY",
          status: "PENDING",
        }
      });
      
      // Here we would send a DICOM Modality Worklist (MWL) request to Examion
      console.log(`[INTEGRATION] Sending DICOM MWL Request to Examion for patient ${patientId}`);
    }

    return NextResponse.json({ 
      success: true, 
      requestId: record?.id,
      message: `Pedido enviado com sucesso para ${source}` 
    });
  } catch (error) {
    console.error("Error requesting diagnostic:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
