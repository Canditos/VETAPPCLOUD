import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Ensure the user is a TUTOR and is authenticated
  if (!session || (session.user as any).role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = (session.user as any).ownerId;
  const clinicId = (session.user as any).clinicId;

  if (!ownerId || !clinicId) {
    return NextResponse.json({ error: "User session missing profile links" }, { status: 400 });
  }

  const tenantPrisma = getTenantClient(clinicId);

  try {
    const invoices = await tenantPrisma.invoice.findMany({
      where: { ownerId },
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
