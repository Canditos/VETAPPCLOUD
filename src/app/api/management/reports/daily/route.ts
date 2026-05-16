import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const paymentsRaw = await prisma.payment.findMany({
      where: { 
        clinicId,
        createdAt: { gte: startOfDay }
      },
    });

    const paymentsByMethod = paymentsRaw.reduce((acc: any, p: any) => {
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
  } catch (error) {
    console.error("[DAILY_REPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
