import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfToday, endOfToday } from "date-fns";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    const today = new Date();
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // 1. Fetch Key KPIs
    const [totalPatients, pendingRequests, activeConsultations, monthlyInvoices] = await Promise.all([
      prisma.patient.count({ where: { clinicId, status: "ACTIVE" } }),
      prisma.portalAppointmentRequest.count({ where: { clinicId, status: "PENDING" } }),
      prisma.consultation.count({ 
        where: { 
          clinicId, 
          date: { gte: startOfToday(), lte: endOfToday() } 
        } 
      }),
      // Simulando faturamento (Idealmente viria do Jasmin/Vendus)
      prisma.consultation.count({
        where: {
          clinicId,
          date: { gte: startMonth, lte: endMonth }
        }
      })
    ]);

    // 2. Volume de Consultas Diário (Últimos 7 dias)
    const last7Days = eachDayOfInterval({
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: today
    });

    const dailyConsultations = await Promise.all(
      last7Days.map(async (day) => {
        const count = await prisma.consultation.count({
          where: {
            clinicId,
            date: {
              gte: new Date(day.setHours(0, 0, 0, 0)),
              lte: new Date(day.setHours(23, 59, 59, 999))
            }
          }
        });
        return {
          name: format(day, "EEE"),
          consultas: count
        };
      })
    );

    // 3. Distribuição por Espécie
    const speciesDistribution = await prisma.patient.groupBy({
      by: ["species"],
      where: { clinicId, status: "ACTIVE" },
      _count: true
    });

    return NextResponse.json({
      kpis: {
        totalPatients,
        pendingRequests,
        todayAppointments: activeConsultations,
        monthlyGrowth: "+12%", // Mock por agora
        estimatedRevenue: monthlyInvoices * 45 // Estimativa baseada em 45€ por consulta
      },
      charts: {
        dailyConsultations,
        species: speciesDistribution.map((s: any) => ({
          name: s.species,
          value: s._count
        }))
      }
    });
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
