import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    const now = new Date();

    // 1. Faturação Mensal (Últimos 6 meses)
    const monthlyBilling = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const payments = await prisma.payment.aggregate({
        where: {
          clinicId,
          paidAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      });

      monthlyBilling.push({
        month: monthStart.toLocaleString('pt-PT', { month: 'short' }),
        total: Number(payments._sum.amount || 0)
      });
    }

    // 2. Mix de Receita por Categoria (Top 5)
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: { clinicId }
      },
      select: {
        description: true,
        price: true,
        quantity: true
      }
    });

    const categories = invoiceItems.reduce((acc: any, item: any) => {
      const total = Number(item.price) * item.quantity;
      acc[item.description] = (acc[item.description] || 0) + total;
      return acc;
    }, {});

    const topCategories = Object.entries(categories)
      .map(([name, total]) => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 3. Métricas de Performance
    const totalPatients = await prisma.patient.count({ where: { clinicId } });
    const appointmentsThisMonth = await prisma.appointment.count({
      where: {
        clinicId,
        startTime: { gte: startOfMonth(now) }
      }
    });

    return NextResponse.json({
      monthlyBilling,
      topCategories,
      metrics: {
        totalPatients,
        appointmentsThisMonth,
        conversionRate: 85 // Mock por agora
      }
    });
  } catch (error) {
    console.error("[BI_API_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
