import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuthParams(async ({ tenantPrisma }, { id }) => {
  try {
    const customer = await tenantPrisma.owner.findUnique({
      where: { id },
      include: {
        patients: {
          include: {
            _count: { select: { appointments: true, consultations: true } }
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
        },
        privacyConsents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { accepted: true },
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const totalInvoiced = customer.invoices.reduce((acc: any, inv: any) => acc + Number(inv.total), 0);
    const totalPaid = customer.payments.reduce((acc: any, pay: any) => acc + Number(pay.amount), 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    const enriched = {
      ...customer,
      patients: customer.patients.map((p: any) => ({
        ...p,
        _count: {
          ...p._count,
          visitCount: (p._count?.appointments || 0) + (p._count?.consultations || 0),
        }
      })),
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
});

export const PATCH = withAuthParams(async ({ req, tenantPrisma }, { id }) => {
  try {
    const existing = await tenantPrisma.owner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, phone, vatNumber, address, notes, rxClientId } = body;

    const customer = await tenantPrisma.owner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(rxClientId !== undefined && { rxClientId }),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
