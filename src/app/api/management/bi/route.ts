import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startOfMonth, subMonths, format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

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

    // 1. Tendência de Faturação (últimos 6 meses)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const monthRevenue = await prisma.payment.aggregate({
        where: {
          clinicId: user.clinicId,
          paidAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          amount: true
        }
      });

      revenueTrend.push({
        month: format(monthDate, "MMM", { locale: pt }),
        revenue: monthRevenue._sum.amount || 0
      });
    }

    // 2. Distribuição por Espécie
    const speciesData = await prisma.patient.groupBy({
      by: ['species'],
      where: { clinicId: user.clinicId },
      _count: { _all: true }
    });

    const speciesDistribution = speciesData.map(item => ({
      name: item.species,
      value: item._count._all
    }));

    // 3. Estatísticas Gerais
    const totalPatients = await prisma.patient.count({ where: { clinicId: user.clinicId } });
    const totalPayments = await prisma.payment.aggregate({
      where: { clinicId: user.clinicId },
      _sum: { amount: true },
      _count: { _all: true }
    });

    const avgTicket = totalPayments._count._all > 0 
      ? (totalPayments._sum.amount || 0) / totalPayments._count._all 
      : 0;

    return NextResponse.json({
      revenueTrend,
      speciesDistribution,
      stats: {
        totalPatients,
        totalRevenue: totalPayments._sum.amount || 0,
        avgTicket: avgTicket.toFixed(2),
        activeCases: await prisma.consultation.count({ 
          where: { clinicId: user.clinicId, date: { gte: startOfMonth(new Date()) } } 
        })
      }
    });
  } catch (error) {
    console.error("[BI_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
