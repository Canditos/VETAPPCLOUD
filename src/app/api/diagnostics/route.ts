import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [labResults, imagingStudies] = await Promise.all([
      prisma.labResult.findMany({
        where: { clinicId: session.user.clinicId },
        include: { patient: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.imagingStudy.findMany({
        where: { clinicId: session.user.clinicId },
        include: { patient: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedLab = labResults.map((lr) => ({
      id: lr.id,
      patient: lr.patient.name,
      owner: "Consultar Ficha", // Seria necessário incluir o owner no prisma se quiséssemos o nome aqui direto
      type: "LAB",
      source: lr.source,
      status: lr.abnormalFlags ? "ALERT" : "COMPLETED",
      createdAt: lr.createdAt,
      summary: (lr.dataJson as any)?.testName || "Análises Clínicas",
    }));

    const formattedImaging = imagingStudies.map((is) => ({
      id: is.id,
      patient: is.patient.name,
      owner: "Consultar Ficha",
      type: "IMAGING",
      source: "Examion RX", // Ou puxar do metadataJson se existir
      status: "COMPLETED",
      createdAt: is.createdAt,
      summary: (is.metadataJson as any)?.studyDescription || "Exame de Imagem",
    }));

    const allDiagnostics = [...formattedLab, ...formattedImaging].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allDiagnostics);
  } catch (error) {
    console.error("[DIAGNOSTICS_GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
