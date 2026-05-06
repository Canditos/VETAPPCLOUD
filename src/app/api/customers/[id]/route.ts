import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clinicId = "c1-demo-clinic";

  const mockCustomer = generateMockCustomer(id);

  try {
    const customer = await prisma.owner.findUnique({
      where: { id, clinicId },
      include: {
        patients: {
          include: {
            consultations: {
              orderBy: { date: 'desc' },
              take: 5
            }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        subscriptions: {
          include: { plan: true }
        }
      }
    });

    if (customer) {
       // Defensive check for financial fields
       const enriched = {
         ...customer,
         totalInvoiced: (customer as any).totalInvoiced || 0,
         totalPaid: (customer as any).totalPaid || 0,
         balance: (customer as any).balance || 0,
       };
       return NextResponse.json(enriched);
    }
    
    // Demo fallback logic
    return NextResponse.json(mockCustomer);
  } catch (error) {
    console.error("Hub error, returning mock:", error);
    return NextResponse.json(mockCustomer);
  }
}

function generateMockCustomer(id: string) {
  const isDemo1 = id === "demo-owner-1" || id === "c1" || id === "1";
  return {
    id,
    name: isDemo1 ? "Ricardo Fonseca" : "Ana Martins",
    email: isDemo1 ? "ricardo.fonseca@email.com" : "ana.martins@email.com",
    phone: isDemo1 ? "910 000 001" : "960 000 002",
    address: isDemo1 ? "Rua dos Animais, 45, Setúbal" : "Urbanização das Flores, Palmela",
    vatNumber: isDemo1 ? "234567890" : "123123123",
    totalInvoiced: isDemo1 ? 1250.80 : 450.00,
    totalPaid: isDemo1 ? 1100.00 : 400.00,
    balance: isDemo1 ? -150.80 : -50.00,
    patients: isDemo1 ? [
      { 
        id: "p1", 
        name: "Bolinha", 
        species: "Gato", 
        breed: "Siamês",
        gender: "F",
        weight: 4.2,
        birthDate: "2021-02-10",
        microchip: "900123456789012",
        _count: { consultations: 12 }
      }
    ] : [
      { 
        id: "p2", 
        name: "Rex", 
        species: "Cão", 
        breed: "Pastor Alemão",
        gender: "M",
        weight: 32.5,
        birthDate: "2019-11-20",
        microchip: "900123456789013",
        _count: { consultations: 5 }
      }
    ],
    invoices: [
      { id: "inv1", jasminInvoiceId: "FT 2026/1", total: 70.0, status: "PAID", createdAt: new Date().toISOString() }
    ],
    payments: [
      { id: "pay-1", amount: 70.0, method: "MBWAY", paidAt: new Date().toISOString() }
    ],
    subscriptions: [
      { id: "sub-1", status: "ACTIVE", plan: { name: "Plano Wellness Gold", price: 29.90 } }
    ]
  };
}
