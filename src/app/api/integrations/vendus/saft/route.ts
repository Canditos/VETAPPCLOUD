import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VendusService } from "@/lib/vendus-service";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { vendusApiKey: true },
  });

  if (!clinic?.vendusApiKey) {
    return NextResponse.json({ error: "Vendus não configurado" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || "");
  const month = parseInt(searchParams.get("month") || "");

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parâmetros year e month são obrigatórios" }, { status: 400 });
  }

  try {
    const vendus = new VendusService(clinic.vendusApiKey);
    const saft = await vendus.getSaft(year, month);
    const xml = Buffer.from(saft.xml, "base64").toString("utf-8");

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="SAFT_${year}_${month.toString().padStart(2, "0")}.xml"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao exportar SAF-T" }, { status: 500 });
  }
}
