import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const tenantPrisma = getTenantClient(clinicId);

    const { id } = await params;

    const customer = await tenantPrisma.owner.findUnique({
      where: { id },
      include: {
        patients: {
          include: {
            _count: { select: { consultations: true } }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        subscriptions: {
          include: { plan: true }
        },
        budgets: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (customer.clinicId !== clinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalInvoiced = customer.invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    const totalPaid = customer.payments.reduce((acc, pay) => acc + Number(pay.amount), 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    const enriched = {
      ...customer,
      stats: {
        totalInvoiced,
        totalPaid,
        outstandingBalance
      }
    };

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[CUSTOMER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
