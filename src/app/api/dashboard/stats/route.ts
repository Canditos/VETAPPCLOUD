import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { clinicId: true }
    });

    if (!user?.clinicId) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // 1. Consultas Hoje
    const consultationsToday = await prisma.consultation.count({
      where: {
        clinicId: user.clinicId,
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    // 2. Novos Pacientes (últimos 30 dias)
    const thirtyDaysAgo = subDays(today, 30);
    const newPatients = await prisma.patient.count({
      where: {
        clinicId: user.clinicId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // 3. Faturação Hoje
    const revenueToday = await prisma.payment.aggregate({
      where: {
        clinicId: user.clinicId,
        paidAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      _sum: {
        amount: true
      }
    });

    // 4. Stock Crítico
    const criticalStock = await prisma.product.count({
      where: {
        clinicId: user.clinicId,
        stockQuantity: {
          lte: 5 // Definimos 5 como limiar crítico genérico
        }
      }
    });

    // 5. Próximas Consultas (Top 3)
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: user.clinicId,
        startTime: {
          gte: today
        },
        status: "SCHEDULED"
      },
      include: {
        patient: true
      },
      orderBy: {
        startTime: "asc"
      },
      take: 3
    });

    // 6. Atividade Recente (Consultas e Pagamentos)
    const recentConsultations = await prisma.consultation.findMany({
      where: { clinicId: user.clinicId },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const recentPayments = await prisma.payment.findMany({
      where: { clinicId: user.clinicId },
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    // Mesclar e ordenar
    const activity = [
      ...recentConsultations.map(c => ({
        type: "CONSULTATION",
        title: `Consulta: ${c.patient.name}`,
        desc: "Finalizada",
        time: c.createdAt,
        icon: "Stethoscope",
        color: "bg-blue-500",
        href: `/dashboard/patients?id=${c.patientId}`
      })),
      ...recentPayments.map(p => ({
        type: "PAYMENT",
        title: `Pagamento: ${p.owner.name}`,
        desc: `Valor: €${p.amount}`,
        time: p.createdAt,
        icon: "TrendingUp",
        color: "bg-emerald-500",
        href: "/dashboard/billing"
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    return NextResponse.json({
      consultationsToday,
      newPatients,
      revenueToday: revenueToday._sum.amount || 0,
      criticalStock,
      upcomingAppointments,
      activity
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
