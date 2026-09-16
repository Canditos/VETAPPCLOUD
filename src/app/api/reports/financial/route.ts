import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { toCents, fromCents, sumMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    // Fetch payments for revenue
    const payments = await prisma.payment.findMany({
      where: { clinicId },
      orderBy: { createdAt: "asc" },
      take: 2000,
    });

    const totalRevenue = sumMoney(payments.map((p) => p.amount));

    // Group by month
    const monthlyCents: Record<string, number> = {};
    payments.forEach((p) => {
      const month = p.createdAt.toLocaleString('pt-PT', { month: 'short' });
      monthlyCents[month] = (monthlyCents[month] || 0) + toCents(p.amount);
    });

    const monthlyArray = Object.entries(monthlyCents).map(([month, cents]) => ({
      month,
      revenue: fromCents(cents),
      expenses: 0
    })).slice(-6);

    // Top Clients
    const topOwners = await prisma.payment.groupBy({
      by: ['ownerId'],
      where: { clinicId },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5
    });

    const topClients = await Promise.all(topOwners.map(async (o: any) => {
      const owner = await prisma.owner.findUnique({ where: { id: o.ownerId } });
      return {
        name: owner?.name || "Desconhecido",
        visits: o._count.id,
        totalSpent: o._sum.amount || 0
      };
    }));

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        growth: 0, // Need historical data for this
        monthly: monthlyArray
      },
      servicesBreakdown: [
        { name: "Consultas", value: 100, color: "#3b82f6" }, // Placeholder for now
      ],
      inventoryStats: {
        stockValue: 0,
        expiringValue: 0,
        margin: 0
      },
      topClients
    });
  } catch (error) {
    console.error("[FINANCIAL_REPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
