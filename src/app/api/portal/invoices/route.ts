import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPortalSession } from "@/lib/auth-portal";

export async function GET(req: Request) {
  const session = await getPortalSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = session.ownerId;
  const clinicId = session.clinicId;

  if (!ownerId || !clinicId) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { ownerId, clinicId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

     const stats = {
      totalInvoiced: invoices.reduce((acc: any, inv: any) => acc + Number(inv.total), 0),
      outstandingBalance: invoices
        .filter((inv: any) => inv.status !== "PAID")
        .reduce((acc: any, inv: any) => acc + Number(inv.total), 0),
    };

    return NextResponse.json({ invoices, stats });
  } catch (error) {
    console.error("[PORTAL_INVOICES] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
