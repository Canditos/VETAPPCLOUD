/**
 * API ROUTE: /api/patients/[id]/summary
 *
 * Responsabilidade: Gerar um resumo clínico inteligente baseado
 * inteiramente nos dados locais do paciente. ZERO dados saem da
 * infraestrutura — este é um algoritmo de regras, não uma LLM.
 *
 * Futuro: Integrar com IA externa (Groq/OpenRouter) via
 * /api/ai/anonymized-summary, com dados completamente anonimizados.
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";
import { differenceInDays, differenceInMonths, differenceInYears, isPast } from "date-fns";

export const GET = withAuthParams(async ({ tenantPrisma, clinicId }, { id: patientId }) => {
  const patient = (await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      owner: { select: { name: true, phone: true } },
      vaccinations: { orderBy: { appliedAt: "desc" } },
      dewormings: { orderBy: { appliedAt: "desc" } },
      consultations: {
        orderBy: { date: "desc" },
        take: 3,
        include: { notes: true, veterinarian: { select: { name: true } } },
      },
      vitalSigns: { orderBy: { date: "desc" }, take: 2 },
    },
  })) as any;

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  const now = new Date();

  // ─── Idade real ───
  let ageText = "Idade desconhecida";
  if (patient.birthDate) {
    const years = differenceInYears(now, new Date(patient.birthDate));
    const months = differenceInMonths(now, new Date(patient.birthDate)) % 12;
    if (years > 0) {
      ageText = `${years} ano${years > 1 ? "s" : ""}${months > 0 ? ` e ${months} mês${months > 1 ? "es" : ""}` : ""}`;
    } else if (months > 0) {
      ageText = `${months} mês${months > 1 ? "es" : ""}`;
    } else {
      const days = differenceInDays(now, new Date(patient.birthDate));
      ageText = `${days} dia${days > 1 ? "s" : ""}`;
    }
  }

  // ─── Vacinas ───
  const expiredVaccines = patient.vaccinations.filter((v: any) => v.expiresAt && isPast(new Date(v.expiresAt)));
  const upcomingVaccines = patient.vaccinations.filter((v: any) => {
    if (!v.expiresAt) return false;
    const daysLeft = differenceInDays(new Date(v.expiresAt), now);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  // ─── Desparasitações ───
  const lastDeworming = patient.dewormings[0];
  const dewormingOverdue = lastDeworming?.expiresAt && isPast(new Date(lastDeworming.expiresAt));

  // ─── Última consulta ───
  const lastConsultation = patient.consultations[0];
  const daysSinceLastConsult = lastConsultation ? differenceInDays(now, new Date(lastConsultation.date)) : null;

  // ─── Peso ───
  const weightTrend =
    patient.vitalSigns.length >= 2
      ? patient.vitalSigns[0].weight && patient.vitalSigns[1].weight
        ? Number(patient.vitalSigns[0].weight) - Number(patient.vitalSigns[1].weight)
        : null
      : null;

  // ─── Recomendações baseadas em regras ───
  const recommendations: string[] = [];

  if (expiredVaccines.length > 0) {
    recommendations.push(`Renovar ${expiredVaccines[0].vaccineName} (expirada)`);
  }
  if (upcomingVaccines.length > 0) {
    recommendations.push(`Agendar ${upcomingVaccines[0].vaccineName} (expira em ${differenceInDays(new Date(upcomingVaccines[0].expiresAt!), now)} dias)`);
  }
  if (dewormingOverdue) {
    recommendations.push("Desparasitação em atraso — agendar");
  }
  if (daysSinceLastConsult && daysSinceLastConsult > 180) {
    recommendations.push("Check-up preventivo recomendado (última consulta há +6 meses)");
  }
  if (!patient.microchip) {
    recommendations.push("Considerar microchipagem");
  }
  if (patient.weight && Number(patient.weight) > 8 && patient.species.toLowerCase().includes("gato")) {
    recommendations.push("Avaliação nutricional recomendada (peso elevado)");
  }

  // ─── Alertas de segurança ───
  const safetyAlerts: string[] = [];
  if (patient.allergies) {
    safetyAlerts.push(`Alérgico a: ${patient.allergies}`);
  }
  if (patient.aggressionLevel && patient.aggressionLevel.toLowerCase() !== "nenhuma") {
    safetyAlerts.push(`Nível de agressão: ${patient.aggressionLevel}`);
  }

  const summary = {
    patientName: patient.name,
    species: patient.species,
    gender: patient.gender === "M" ? "Macho" : patient.gender === "F" ? "Fêmea" : "Indeterminado",
    breed: patient.breed || "Raça indeterminada",
    ageText,
    ownerName: patient.owner?.name ?? "—",

    weight: patient.weight ? `${Number(patient.weight).toFixed(2)} kg` : null,
    weightTrend:
      weightTrend !== null
        ? weightTrend > 0
          ? `+${weightTrend.toFixed(2)} kg desde a última pesagem`
          : `${weightTrend.toFixed(2)} kg desde a última pesagem`
        : null,

    lastConsultation: lastConsultation
      ? {
          date: lastConsultation.date.toISOString(),
          daysAgo: daysSinceLastConsult,
          veterinarian: lastConsultation.veterinarian?.name ?? "—",
          notes: lastConsultation.notes?.plan ?? lastConsultation.notes?.assessment ?? null,
        }
      : null,

    vaccines: {
      total: patient.vaccinations.length,
      expired: expiredVaccines.map((v: any) => v.vaccineName),
      upcoming: upcomingVaccines.map((v: any) => ({
        name: v.vaccineName,
        daysLeft: differenceInDays(new Date(v.expiresAt!), now),
      })),
    },

    deworming: {
      lastType: lastDeworming?.type ?? null,
      lastDate: lastDeworming?.appliedAt?.toISOString() ?? null,
      overdue: dewormingOverdue ?? false,
    },

    recommendations,
    safetyAlerts,
    microchip: patient.microchip ?? null,
    reproductiveStatus: patient.reproductiveStatus ?? null,

    // Metadados para debug
    generatedAt: new Date().toISOString(),
    dataSource: "local-rules-engine",
    privacy: "100% on-premise — nenhum dado enviado para IA externa",
  };

  return NextResponse.json(summary);
});
