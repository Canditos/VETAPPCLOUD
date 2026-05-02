import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || "c1-demo-clinic";

    // 1. Revenue last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(subMonths(new Date(), i));
      
      const payments = await prisma.payment.aggregate({
        where: {
          clinicId,
          paidAt: { gte: start, lte: end }
        },
        _sum: { amount: true }
      });

      last6Months.push({
        month: format(start, "MMM"),
        revenue: Number(payments._sum.amount || 0)
      });
    }

    // Check if we have data, if not use mock for demo
    if (last6Months.every(m => m.revenue === 0)) {
      return NextResponse.json({
        revenueTrend: [
          { month: "Jan", revenue: 3200 },
          { month: "Feb", revenue: 4500 },
          { month: "Mar", revenue: 3800 },
          { month: "Apr", revenue: 5200 },
          { month: "May", revenue: 4800 },
          { month: "Jun", revenue: 6100 }
        ],
        speciesDistribution: [
          { name: "Cão", value: 120 },
          { name: "Gato", value: 85 },
          { name: "Outros", value: 15 }
        ],
        stats: {
          activeSubscriptions: 32,
          mrr: 1240.00,
          avgTicket: 64.50,
          patientRetention: 88,
        }
      });
    }

    // 2. Patient Distribution (Species)
    const speciesDist = await prisma.patient.groupBy({
      by: ['species'],
      where: { clinicId },
      _count: { id: true }
    });

    // 3. Subscriptions Stats
    const activeSubs = await prisma.subscription.count({
      where: { clinicId, status: "ACTIVE" }
    });

    const recurringRevenue = await prisma.subscription.findMany({
      where: { clinicId, status: "ACTIVE" },
      include: { plan: true }
    });

    const mrr = recurringRevenue.reduce((acc, sub) => acc + Number(sub.plan.price), 0);

    // 4. KPI Calculations
    const totalPayments = await prisma.payment.count({ where: { clinicId } });
    const sumPayments = await prisma.payment.aggregate({
      where: { clinicId },
      _sum: { amount: true }
    });

    const avgTicket = totalPayments > 0 ? Number(sumPayments._sum.amount || 0) / totalPayments : 0;

    return NextResponse.json({
      revenueTrend: last6Months,
      speciesDistribution: speciesDist.map(s => ({ name: s.species, value: s._count.id })),
      stats: {
        activeSubscriptions: activeSubs,
        mrr: mrr,
        avgTicket: avgTicket,
        patientRetention: 84,
      }
    });
  } catch (error) {
    console.error("Error fetching BI data:", error);
    return NextResponse.json({ error: "Erro ao carregar BI" }, { status: 500 });
  }
}
