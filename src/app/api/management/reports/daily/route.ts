import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  
  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  const targetDate = dateStr ? parseISO(dateStr) : new Date();
  const startDate = startOfDay(targetDate);
  const endDate = endOfDay(targetDate);

  try {
    const invoices = await tenantPrisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "PAID",
      },
    });

    // Aggregate by Payment Method
    const payments = invoices.reduce((acc: any, inv) => {
      const method = inv.paymentMethod || "UNKNOWN";
      if (!acc[method]) acc[method] = 0;
      acc[method] += Number(inv.total);
      acc.total += Number(inv.total);
      return acc;
    }, { total: 0 });

    return NextResponse.json({
      date: format(targetDate, "yyyy-MM-dd"),
      payments,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Daily Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

// Helper to avoid build error
function format(date: Date, fmt: string) {
  return date.toISOString().split('T')[0];
}
