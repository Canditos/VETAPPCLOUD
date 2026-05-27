import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPortalSession } from "@/lib/auth-portal";

export const GET = withPortalSession(async ({ portalSession }) => {
  const ownerId = portalSession.ownerId;
  const clinicId = portalSession.clinicId;

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
      totalInvoiced: invoices.reduce((acc, inv) => acc + Number(inv.total), 0),
      outstandingBalance: invoices
        .filter((inv) => inv.status !== "PAID")
        .reduce((acc, inv) => acc + Number(inv.total), 0),
    };

    return NextResponse.json({ invoices, stats });
  } catch (error) {
    console.error("[PORTAL_INVOICES] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
