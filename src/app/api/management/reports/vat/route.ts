import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  
  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);

  const startDate = month ? startOfMonth(parseISO(`${month}-01`)) : startOfMonth(new Date());
  const endDate = month ? endOfMonth(parseISO(`${month}-01`)) : endOfMonth(new Date());

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

    // Aggregate by VAT rates
    const report = invoices.reduce((acc, inv) => {
      acc.totalGross += Number(inv.total);
      acc.totalVat6 += Number(inv.vatTotal6);
      acc.totalVat13 += Number(inv.vatTotal13);
      acc.totalVat23 += Number(inv.vatTotal23);
      
      // Calculate taxable bases (Simplified)
      acc.base6 += Number(inv.vatTotal6) / 0.06;
      acc.base13 += Number(inv.vatTotal13) / 0.13;
      acc.base23 += Number(inv.vatTotal23) / 0.23;
      
      return acc;
    }, {
      totalGross: 0,
      totalVat6: 0,
      totalVat13: 0,
      totalVat23: 0,
      base6: 0,
      base13: 0,
      base23: 0,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("VAT Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
