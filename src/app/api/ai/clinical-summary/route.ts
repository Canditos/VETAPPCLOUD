/**
 * API ROUTE: /api/ai/clinical-summary
 *
 * Responsabilidade: Gerar resumo clínico via IA externa (Groq)
 * com dados COMPLETAMENTE ANONIMIZADOS.
 *
 * Fluxo:
 *  1. Recebe patientId
 *  2. Busca dados reais do paciente (tenant isolation)
 *  3. Anonimiza (remove nomes, IDs, NIFs)
 *  4. Envia para Groq
 *  5. Retorna resumo + disclaimer
 *
 * Custo: Gratuito (Groq free tier)
 * Privacidade: Nenhum PII sai da infraestrutura
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { anonymizeClinicalData, generateAISummary } from "@/lib/ai-service";

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  const body = await req.json();
  const { patientId } = body;

  if (!patientId) {
    return NextResponse.json({ error: "patientId obrigatório" }, { status: 400 });
  }

  // Buscar dados reais (com tenant isolation)
  const patient = (await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      vaccinations: { orderBy: { appliedAt: "desc" } },
      dewormings: { orderBy: { appliedAt: "desc" } },
      consultations: { orderBy: { date: "desc" }, take: 1 },
      vitalSigns: { orderBy: { recordedAt: "desc" }, take: 2 },
    },
  })) as any;

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  // Anonimizar
  const now = new Date();
  const daysSinceLastConsult = patient.consultations[0]
    ? Math.floor((now.getTime() - new Date(patient.consultations[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const weightTrend =
    patient.vitalSigns.length >= 2 && patient.vitalSigns[0].weight && patient.vitalSigns[1].weight
      ? Number(patient.vitalSigns[0].weight) - Number(patient.vitalSigns[1].weight)
      : null;

  const anonymized = anonymizeClinicalData({
    patientName: patient.name,
    species: patient.species,
    gender: patient.gender === "M" ? "Macho" : "Fêmea",
    breed: patient.breed || "Indeterminada",
    ageText: patient.birthDate
      ? `${Math.floor((now.getTime() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} anos`
      : "Desconhecida",
    weight: patient.weight ? `${Number(patient.weight).toFixed(2)} kg` : null,
    lastConsultation: { daysAgo: daysSinceLastConsult },
    vaccines: {
      total: patient.vaccinations.length,
      expired: patient.vaccinations
        .filter((v: any) => v.expiresAt && new Date(v.expiresAt) < now)
        .map((v: any) => v.vaccineName),
      upcoming: patient.vaccinations
        .filter((v: any) => v.expiresAt && new Date(v.expiresAt) >= now)
        .map((v: any) => ({ name: v.vaccineName, daysLeft: Math.floor((new Date(v.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) }))
        .filter((v: any) => v.daysLeft <= 30),
    },
    deworming: { overdue: patient.dewormings[0]?.expiresAt ? new Date(patient.dewormings[0].expiresAt) < now : false },
    allergies: patient.allergies,
    aggressionLevel: patient.aggressionLevel,
    microchip: patient.microchip,
    weightTrend: weightTrend !== null ? `${weightTrend > 0 ? "+" : ""}${weightTrend.toFixed(2)} kg` : null,
    recommendations: [],
  });

  // Chamar IA
  const aiResult = await generateAISummary(anonymized);

  return NextResponse.json({
    ...aiResult,
    privacy: "Dados anonimizados — nenhum PII foi enviado para IA externa",
    model: "llama-3.1-8b-instant (Groq)",
    patientName: patient.name, // Re-anonimizado para UI
  });
});
