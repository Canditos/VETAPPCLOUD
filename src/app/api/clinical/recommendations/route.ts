import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { differenceInYears } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        consultations: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const recommendations = [];
    const age = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : 0;

    // 1. Geriatric Recommendation
    if (age >= 7) {
      recommendations.push({
        id: 'geriatric-checkup',
        title: "Check-up Geriátrico",
        description: `${patient.name} tem ${age} anos. Recomendamos análises de rotina para despiste de problemas renais e cardíacos.`,
        impact: "HIGH",
        category: "Preventiva"
      });
    }

    // 2. Dental Health
    const hasDental = patient.consultations.some((c: any) => c.notes?.assessment?.toLowerCase().includes("destartarização"));
    if (!hasDental) {
      recommendations.push({
        id: 'dental-cleaning',
        title: "Higiene Oral (Destartarização)",
        description: "Não há registo de limpeza dentária recente. Prevenção de doença periodontal.",
        impact: "MEDIUM",
        category: "Estética/Saúde"
      });
    }

    // 3. Breed Specific
    if (patient.breed?.toLowerCase().includes("pastor alemão")) {
      recommendations.push({
        id: 'dysplasia-screening',
        title: "Rastreio de Displasia da Anca",
        description: "Raça com predisposição genética. Recomendamos avaliação radiográfica.",
        impact: "HIGH",
        category: "Específica"
      });
    }

    // 4. Weight Management
    if (patient.weight && Number(patient.weight) > 30 && patient.species === "Cão") {
      recommendations.push({
        id: 'weight-plan',
        title: "Plano de Controlo de Peso",
        description: "Peso acima da média para a raça. Recomendamos dieta especializada.",
        impact: "MEDIUM",
        category: "Nutrição"
      });
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json({ error: "Erro ao gerar recomendações" }, { status: 500 });
  }
}
