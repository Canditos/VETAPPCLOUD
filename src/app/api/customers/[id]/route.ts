import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const clinicId = "c1-demo-clinic";

  try {
    let customer = await prisma.owner.findUnique({
      where: { id, clinicId },
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
        },
        subscriptions: {
          include: { plan: true }
        }
      }
    });

    // Mock data fallback if ID starts with demo-
    if (!customer && id.startsWith("demo-")) {
      customer = {
        id: id,
        name: id === "demo-owner-1" ? "Marco Cândido" : "Ana Silva",
        email: "demo@vet.pt",
        phone: "912 345 678",
        address: "Rua de Demonstração, 1",
        vatNumber: "123456789",
        notes: "Cliente VIP de teste.",
        createdAt: new Date(),
        updatedAt: new Date(),
        clinicId: clinicId,
        patients: [
          {
            id: "p1",
            name: "Bolinha",
            species: "Cão",
            breed: "Pastor Alemão",
            birthDate: new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000), // 8 years old
            weight: 32.5,
            _count: { consultations: 12 }
          }
        ],
        invoices: [],
        budgets: [],
        payments: [],
        subscriptions: []
      } as any;
    }

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...customer,
      stats: {
        totalInvoiced: 450.00,
        totalPaid: 350.00,
        outstandingBalance: 100.00
      }
    });
  } catch (error) {
    console.error("Error fetching customer hub data:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do cliente" }, { status: 500 });
  }
}
