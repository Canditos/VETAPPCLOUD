import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    // Fetch payments for revenue
    const payments = await prisma.payment.findMany({
      where: { clinicId },
      orderBy: { createdAt: "asc" }
    });

    const totalRevenue = payments.reduce((acc: any, p: any) => acc + Number(p.amount), 0);

    // Group by month
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
    payments.forEach((p: any) => {
      const month = p.createdAt.toLocaleString('pt-PT', { month: 'short' });
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
      monthlyData[month].revenue += Number(p.amount);
    });

    const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses
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
}
