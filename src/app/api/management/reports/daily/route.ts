import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { toCents, fromCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const paymentsRaw = await prisma.payment.findMany({
      where: { 
        clinicId,
        createdAt: { gte: startOfDay }
      },
    });

    const centsByMethod = paymentsRaw.reduce((acc: Record<string, number>, p) => {
      const method = p.method || "UNKNOWN";
      acc[method] = (acc[method] || 0) + toCents(p.amount);
      acc.total = (acc.total || 0) + toCents(p.amount);
      return acc;
    }, { total: 0 });

    const paymentsByMethod: Record<string, number> = Object.fromEntries(
      Object.entries(centsByMethod).map(([k, v]) => [k, fromCents(v)])
    );

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      payments: paymentsByMethod,
      count: paymentsRaw.length,
    });
  } catch (error) {
    console.error("[DAILY_REPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
