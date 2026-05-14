export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, subDays, addDays } from "date-fns";

// Safe query wrapper — if a query fails, return fallback instead of crashing
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[DASHBOARD_STATS] Query "${label}" failed:`, err);
    return fallback;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { clinicId: true, name: true, role: true },
    });

    if (!user?.clinicId) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    const { clinicId } = user;
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const thirtyDaysAgo = subDays(today, 30);
    const in7Days = addDays(today, 7);

    // Run all queries in parallel — each one is safe and won't crash the others
    const [
      consultationsToday,
      newPatients,
      revenueToday,
      criticalStockProducts,
      todayAppointments,
      activeHospitalizations,
      overdueVaccinations,
      pendingHospTasks,
      recentConsultations,
      recentPayments,
    ] = await Promise.all([

      // 1. Consultas hoje
      safe("consultationsToday", () =>
        prisma.consultation.count({
          where: { clinicId, date: { gte: startToday, lte: endToday } },
        }), 0),

      // 2. Novos pacientes (30 dias)
      safe("newPatients", () =>
        prisma.patient.count({
          where: { clinicId, createdAt: { gte: thirtyDaysAgo } },
        }), 0),

      // 3. Faturação hoje
      safe("revenueToday", () =>
        prisma.payment.aggregate({
          where: {
            clinicId,
            paidAt: { gte: startToday, lte: endToday },
          },
          _sum: { amount: true },
        }), { _sum: { amount: null } }),

      // 4. Stock crítico
      safe("criticalStock", () =>
        prisma.product.findMany({
          where: {
            clinicId,
            stockQuantity: { lte: 5 },
          },
          select: { id: true, name: true, stockQuantity: true },
        }), []),

      // 5. Marcações de HOJE
      safe("todayAppointments", () =>
        prisma.appointment.findMany({
          where: {
            clinicId,
            startTime: { gte: startToday, lte: endToday },
            status: { not: "CANCELLED" },
          },
          include: {
            patient: { include: { owner: true } },
          },
          orderBy: { startTime: "asc" },
          take: 8,
        }), []),

      // 6. Internamentos ativos
      safe("activeHospitalizations", () =>
        prisma.hospitalization.findMany({
          where: { clinicId, status: "ADMITTED" },
          include: {
            patient: { select: { name: true, species: true } },
            tasks: { where: { status: "PENDING" } },
          },
        }), []),

      // 7. Vacinas expiradas ou a expirar em 7 dias
      safe("overdueVaccinations", () =>
        prisma.vaccination.findMany({
          where: {
            patient: { clinicId },
            expiresAt: { lte: in7Days },
          },
          include: {
            patient: { select: { name: true, clinicId: true } },
          },
          orderBy: { expiresAt: "asc" },
          take: 5,
        }), []),

      // 8. Tarefas de internamento pendentes
      safe("pendingHospTasks", () =>
        prisma.hospitalizationTask.count({
          where: {
            status: "PENDING",
            hospitalization: { clinicId, status: "ADMITTED" },
            scheduledTime: { lte: today },
          },
        }), 0),

      // 9. Consultas recentes
      safe("recentConsultations", () =>
        prisma.consultation.findMany({
          where: { clinicId },
          include: { patient: { select: { name: true, id: true } } },
          orderBy: { createdAt: "desc" },
          take: 4,
        }), []),

      // 10. Pagamentos recentes
      safe("recentPayments", () =>
        prisma.payment.findMany({
          where: { clinicId },
          include: { owner: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 4,
        }), []),
    ]);

    // Build alerts
    const alerts: any[] = [];

    if (criticalStockProducts.length > 0) {
      alerts.push({
        type: "STOCK",
        level: "warning",
        title: `${criticalStockProducts.length} produto${criticalStockProducts.length > 1 ? "s" : ""} com stock crítico`,
        desc: criticalStockProducts.slice(0, 2).map((p: any) => p?.name ?? "").join(", ") + (criticalStockProducts.length > 2 ? "..." : ""),
        href: "/dashboard/inventory",
      });
    }

    const _vax: any[] = Array.isArray(overdueVaccinations) ? (overdueVaccinations as any[]) : [];
    const expiredVaccines = _vax.filter(
      (v: any) => v?.patient?.clinicId === clinicId && v?.expiresAt && new Date(v.expiresAt) < today
    );
    const soonVaccines = _vax.filter(
      (v: any) => v?.patient?.clinicId === clinicId && v?.expiresAt && new Date(v.expiresAt) >= today
    );

    if (expiredVaccines.length > 0) {
      alerts.push({
        type: "VACCINE",
        level: "error",
        title: `${expiredVaccines.length} vacina${expiredVaccines.length > 1 ? "s" : ""} expirada${expiredVaccines.length > 1 ? "s" : ""}`,
        desc: expiredVaccines.map((v: any) => v?.patient?.name ?? "").slice(0, 2).join(", "),
        href: "/dashboard/patients",
      });
    }

    if (soonVaccines.length > 0) {
      alerts.push({
        type: "VACCINE_SOON",
        level: "warning",
        title: `${soonVaccines.length} vacina${soonVaccines.length > 1 ? "s" : ""} a expirar em 7 dias`,
        desc: soonVaccines.map((v: any) => v?.patient?.name ?? "").slice(0, 2).join(", "),
        href: "/dashboard/patients",
      });
    }

    if (pendingHospTasks > 0) {
      alerts.push({
        type: "HOSP_TASKS",
        level: "error",
        title: `${pendingHospTasks} tarefa${pendingHospTasks > 1 ? "s" : ""} de internamento em atraso`,
        desc: "Verificar plano de tratamento",
        href: "/dashboard/internamento",
      });
    }

    // Activity feed
    const activity = [
      ...recentConsultations.map((c: any) => ({
        type: "CONSULTATION",
        title: `Consulta: ${c.patient?.name ?? "—"}`,
        desc: "Finalizada",
        time: c.createdAt,
        icon: "Stethoscope",
        color: "bg-blue-500",
        href: `/dashboard/patients?id=${c.patientId}`,
      })),
      ...recentPayments.map((p: any) => ({
        type: "PAYMENT",
        title: `Pagamento: ${p.owner?.name ?? "—"}`,
        desc: `€${Number(p.amount).toFixed(2)}`,
        time: p.createdAt,
        icon: "TrendingUp",
        color: "bg-emerald-500",
        href: "/dashboard/billing",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    return NextResponse.json({
      userName: user.name,
      consultationsToday,
      newPatients,
      revenueToday: Number(revenueToday._sum.amount ?? 0),
      criticalStock: criticalStockProducts.length,
      todayAppointments,
      activeHospitalizations: activeHospitalizations.map((h: any) => ({
        id: h.id,
        patientName: h.patient.name,
        species: h.patient.species,
        boxNumber: h.boxNumber,
        pendingTasks: h.tasks.length,
        reason: h.reason,
      })),
      alerts,
      activity,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET] Fatal error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
