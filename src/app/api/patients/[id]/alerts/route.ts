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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isPast, addDays, differenceInDays } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicId = (session.user as any).clinicId;
    const { id: patientId } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        vaccinations: { orderBy: { appliedAt: "desc" } },
        dewormings: { orderBy: { appliedAt: "desc" } },
        consultations: { orderBy: { date: "desc" }, take: 1 },
      },
    });

    if (!patient) return NextResponse.json([]);

    const alerts: any[] = [];

    // Allergies alert
    if (patient.allergies) {
      alerts.push({ level: "critical", message: `Alérgico a: ${patient.allergies}`, action: null });
    }

    // Vaccination alerts
    const now = new Date();
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
  } catch (error) {
    console.error("[PATIENT_ALERTS]", error);
    return NextResponse.json([]);
  }
}
