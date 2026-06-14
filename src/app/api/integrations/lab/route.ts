import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Exemplo de body esperado:
// {
//   "clinicId": "...",
//   "patientId": "...",
//   "source": "FUJI" | "EXIGO" | "DRICHEM",
//   "abnormalFlags": false,
//   "dataJson": {
//     "parameters": [
//       { "name": "GLU", "value": 90, "unit": "mg/dL", "refMin": 70, "refMax": 120, "isAbnormal": false }
//     ]
//   }
// }

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;
    
    // Autenticação básica para o endpoint da rede local (Raspberry Pi)
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clinicId, patientId, source, dataJson, abnormalFlags } = body;

    if (!clinicId || !patientId || !source || !dataJson) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Grava o resultado do laboratório na base de dados
    const labResult = await prisma.labResult.create({
      data: {
        clinicId,
        patientId,
        source,
        dataJson,
        abnormalFlags: abnormalFlags || false,
      },
    });

    return NextResponse.json({ success: true, labResultId: labResult.id });
  } catch (error) {
    console.error("Lab Integration API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
