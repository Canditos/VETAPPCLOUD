import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const clinicId = "c1-demo-clinic";

    const targetDate = dateStr ? parseISO(dateStr) : new Date();
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    const paymentsRaw = await prisma.payment.findMany({
      where: {
        clinicId,
        paidAt: { gte: startDate, lte: endDate },
      },
    });

    const paymentsByMethod = paymentsRaw.reduce((acc: any, p) => {
      const method = p.method || "UNKNOWN";
      if (!acc[method]) acc[method] = 0;
      acc[method] += Number(p.amount);
      acc.total += Number(p.amount);
      return acc;
    }, { total: 0 });

    // Mock data fallback if empty
    if (paymentsByMethod.total === 0) {
      return NextResponse.json({
        date: targetDate.toISOString().split('T')[0],
        payments: {
          CASH: 245.50,
          MULTIBANCO: 890.00,
          MBWAY: 156.00,
          TRANSFER: 450.00,
          total: 1741.50
        },
        count: 14,
      });
    }

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      payments: paymentsByMethod,
      count: paymentsRaw.length,
    });
  } catch (error) {
    console.error("Daily Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
