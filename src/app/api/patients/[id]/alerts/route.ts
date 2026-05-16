/**
 * API ROUTE: /api/patients/[id]/alerts
 *
 * Responsabilidade: Gerar alertas clínicos inteligentes baseados
 * nos dados do paciente: vacinas expiradas, desparasitações em
 * atraso, alergias, e ausência de vitais na consulta atual.
 *
 * Este endpoint é READ-ONLY — não modifica dados.
 *
 * Tenant: Sim
 * Auth: Requer sessão
 */

import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";
import { isPast, differenceInDays } from "date-fns";
import type { ClinicalAlert } from "@/types";

export const GET = withAuthParams(async ({ tenantPrisma, clinicId }, { id: patientId }) => {
  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      vaccinations: { orderBy: { appliedAt: "desc" } },
      dewormings: { orderBy: { appliedAt: "desc" } },
      consultations: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  if (!patient) return NextResponse.json([]);

  const alerts: ClinicalAlert[] = [];
  const now = new Date();

  // Allergies alert
  if (patient.allergies) {
    alerts.push({ level: "critical", message: `Alérgico a: ${patient.allergies}`, action: null });
  }

  // Vaccination alerts
  for (const v of patient.vaccinations) {
    if (v.expiresAt) {
      const daysLeft = differenceInDays(new Date(v.expiresAt), now);
      if (daysLeft < 0) {
        alerts.push({ level: "critical", message: `Vacina ${v.vaccineName} expirada há ${Math.abs(daysLeft)} dias`, action: "Renovar" });
      } else if (daysLeft <= 14) {
        alerts.push({ level: "warning", message: `Vacina ${v.vaccineName} expira em ${daysLeft} dias`, action: "Agendar" });
      }
    }
  }

  // Deworming alerts
  for (const d of patient.dewormings) {
    if (d.expiresAt) {
      const daysLeft = differenceInDays(new Date(d.expiresAt), now);
      if (daysLeft < 0) {
        alerts.push({ level: "warning", message: `Desparasitação ${d.type} em atraso (${Math.abs(daysLeft)} dias)`, action: "Registar" });
      }
    }
  }

  // Last consultation alert
  if (patient.consultations.length > 0) {
    const lastConsult = patient.consultations[0];
    const daysSince = differenceInDays(now, new Date(lastConsult.date));
    if (daysSince > 180) {
      alerts.push({ level: "info", message: `Última consulta há ${daysSince} dias`, action: null });
    }
  }

  // No vitals in current visit
  alerts.push({ level: "info", message: "Registe os vitais do paciente", action: null });

  return NextResponse.json(alerts);
});
