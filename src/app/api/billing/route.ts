export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

// GET /api/billing - List invoices for the current clinic
export const GET = withAuth(async ({ req, tenantPrisma }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";

  try {
    const invoices = await tenantPrisma.invoice.findMany({
      include: {
        owner: true,
        consultation: {
          include: {
            patient: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by search term (client name or invoice id)
    const filtered = search
      ? invoices.filter((inv: any) => {
          const ownerName = (inv.owner?.name ?? inv.consultation?.patient?.owner?.name ?? "").toLowerCase();
          const invId = inv.id.toLowerCase();
          const extId = (inv.externalId ?? "").toLowerCase();
          const q = search.toLowerCase();
          return ownerName.includes(q) || invId.includes(q) || extId.includes(q);
        })
      : invoices;

    // Compute summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInvoices = invoices.filter(
      (inv: any) => new Date(inv.createdAt) >= today
    );
    const todayTotal = todayInvoices.reduce(
      (sum: any, inv: any) => sum + Number(inv.total),
      0
    );
    const pendingInvoices = invoices.filter((inv: any) => inv.status === "DRAFT");
    const pendingTotal = pendingInvoices.reduce(
      (sum: any, inv: any) => sum + Number(inv.total),
      0
    );

    return NextResponse.json({
      invoices: filtered,
      stats: {
        todayTotal,
        todayCount: todayInvoices.length,
        pendingTotal,
        pendingCount: pendingInvoices.length,
      },
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
