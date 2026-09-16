import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { toCents, fromCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ req, clinicId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      include: { items: true }
    });

    const report = invoices.reduce((acc: Record<string, number | string>, inv) => {
      inv.items.forEach((item) => {
        const rate = item.vatRate || 23;
        const base = toCents(Number(item.price) * item.quantity);
        const vat = Math.round(base * (rate / 100));

        if (rate === 6) {
          (acc.base6 as number) += base;
          (acc.totalVat6 as number) += vat;
        } else if (rate === 13) {
          (acc.base13 as number) += base;
          (acc.totalVat13 as number) += vat;
        } else {
          (acc.base23 as number) += base;
          (acc.totalVat23 as number) += vat;
        }
        acc.totalGross = (acc.totalGross as number) + base + vat;
      });
      return acc;
    }, {
      month,
      base6: 0,
      totalVat6: 0,
      base13: 0,
      totalVat13: 0,
      base23: 0,
      totalVat23: 0,
      totalGross: 0,
      status: "REAL"
    });

    const result = {
      ...report,
      base6: fromCents(report.base6 as number),
      totalVat6: fromCents(report.totalVat6 as number),
      base13: fromCents(report.base13 as number),
      totalVat13: fromCents(report.totalVat13 as number),
      base23: fromCents(report.base23 as number),
      totalVat23: fromCents(report.totalVat23 as number),
      totalGross: fromCents(report.totalGross as number),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[VAT_REPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
