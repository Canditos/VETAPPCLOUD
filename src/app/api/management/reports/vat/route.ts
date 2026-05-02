import { NextResponse } from "next/server";
import prisma, { getTenantClient } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const clinicId = "c1-demo-clinic"; // Default for demo

    const startDate = month ? startOfMonth(parseISO(`${month}-01`)) : startOfMonth(new Date());
    const endDate = month ? endOfMonth(parseISO(`${month}-01`)) : endOfMonth(new Date());

    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: { gte: startDate, lte: endDate },
        status: "PAID",
      },
    });

    const report = invoices.reduce((acc, inv) => {
      acc.totalGross += Number(inv.total);
      acc.totalVat6 += Number(inv.vatTotal6);
      acc.totalVat13 += Number(inv.vatTotal13);
      acc.totalVat23 += Number(inv.vatTotal23);
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

    // Mock data fallback if empty
    if (report.totalGross === 0) {
      return NextResponse.json({
        totalGross: 4520.50,
        totalVat6: 84.20,
        totalVat13: 156.40,
        totalVat23: 642.10,
        base6: 1403.33,
        base13: 1203.07,
        base23: 2791.73,
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("VAT Report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
