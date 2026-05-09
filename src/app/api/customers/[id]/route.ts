import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { clinicId: true }
    });

    if (!user?.clinicId) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    const { id } = await params;
    const clinicId = user.clinicId;

    const customer = await prisma.owner.findUnique({
      where: { id, clinicId },
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
      return new NextResponse("Customer not found", { status: 404 });
    }

    // Calcular estatísticas financeiras reais
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
