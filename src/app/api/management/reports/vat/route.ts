import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;
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

    const report = invoices.reduce((acc, inv) => {
      inv.items.forEach(item => {
        const rate = item.vatRate || 23;
        const base = Number(item.price) * item.quantity;
        const vat = base * (rate / 100);

        if (rate === 6) {
          acc.base6 += base;
          acc.totalVat6 += vat;
        } else if (rate === 13) {
          acc.base13 += base;
          acc.totalVat13 += vat;
        } else {
          acc.base23 += base;
          acc.totalVat23 += vat;
        }
        acc.totalGross += (base + vat);
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

    return NextResponse.json(report);
  } catch (error) {
    console.error("[VAT_REPORT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
