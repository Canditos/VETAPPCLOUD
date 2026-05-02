import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getTenantClient(session.user.clinicId);
  const { id } = params;

  try {
    const customer = await prisma.owner.findUnique({
      where: { id, clinicId: session.user.clinicId },
      include: {
        patients: {
          include: {
            _count: {
              select: { consultations: true }
            }
          }
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        budgets: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Calculate Outstanding Balance
    const financialStats = await prisma.invoice.aggregate({
      where: { 
        ownerId: id,
        status: { not: "CANCELLED" }
      },
      _sum: { total: true }
    });

    const paymentStats = await prisma.payment.aggregate({
      where: { ownerId: id },
      _sum: { amount: true }
    });

    const totalInvoiced = Number(financialStats._sum.total || 0);
    const totalPaid = Number(paymentStats._sum.amount || 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    return NextResponse.json({
      ...customer,
      stats: {
        totalInvoiced,
        totalPaid,
        outstandingBalance
      }
    });
  } catch (error) {
    console.error("Error fetching customer hub data:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do cliente" }, { status: 500 });
  }
}
