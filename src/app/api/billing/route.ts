export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

// GET /api/billing - List invoices for the current clinic
export const GET = withAuth(async ({ req, tenantPrisma }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";

  try {
    const whereClause: any = search
      ? {
          OR: [
            { owner: { name: { contains: search, mode: "insensitive" } } },
            { externalId: { contains: search, mode: "insensitive" } },
            { id: { contains: search, mode: "insensitive" } },
            { consultation: { patient: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [invoices, todayStats, pendingStats] = await Promise.all([
      tenantPrisma.invoice.findMany({
        where: whereClause,
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
        take: 100,
      }),
      tenantPrisma.invoice.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { total: true },
        _count: { id: true },
      }),
      tenantPrisma.invoice.aggregate({
        where: { status: "DRAFT" },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      invoices,
      stats: {
        todayTotal: Number(todayStats._sum.total ?? 0),
        todayCount: todayStats._count.id,
        pendingTotal: Number(pendingStats._sum.total ?? 0),
        pendingCount: pendingStats._count.id,
      },
    });
  } catch (error) {
    console.error("Error fetching billing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
