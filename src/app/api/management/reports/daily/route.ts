import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const mockDaily = {
    date: new Date().toISOString().split('T')[0],
    payments: {
      CASH: 245.50,
      MULTIBANCO: 1240.00,
      MBWAY: 456.00,
      TRANSFER: 850.00,
      total: 2791.50
    },
    count: 18,
  };

  try {
    const paymentsRaw = await prisma.payment.findMany({
      where: { clinicId: "c1-demo-clinic" },
    });

    if (paymentsRaw && paymentsRaw.length > 0) {
      const paymentsByMethod = paymentsRaw.reduce((acc: any, p) => {
        const method = p.method || "UNKNOWN";
        if (!acc[method]) acc[method] = 0;
        acc[method] += Number(p.amount);
        acc.total += Number(p.amount);
        return acc;
      }, { total: 0 });
      
      return NextResponse.json({
        date: new Date().toISOString().split('T')[0],
        payments: paymentsByMethod,
        count: paymentsRaw.length,
      });
    }

    return NextResponse.json(mockDaily);
  } catch (error) {
    return NextResponse.json(mockDaily);
  }
}
