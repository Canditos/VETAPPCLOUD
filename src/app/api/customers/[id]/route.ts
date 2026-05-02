import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const clinicId = "c1-demo-clinic";

  const mockCustomer = {
    id: "demo-owner-1",
    name: "Marco Cândido",
    email: "marco@example.com",
    phone: "912 345 678",
    address: "Rua Principal, 123",
    taxNumber: "123456789",
    patients: [
      { 
        id: "p1", 
        name: "Bolinha", 
        species: "Cão", 
        breed: "Pastor Alemão", 
        birthDate: "2018-05-15",
        weight: "32.5",
        consultations: [
          { id: "c1", date: new Date().toISOString(), type: "Check-up", status: "COMPLETED" }
        ]
      }
    ],
    invoices: [
      { id: "inv-1", number: "FT 2024/001", amount: 125.50, status: "PAID", date: new Date().toISOString() },
      { id: "inv-2", number: "FT 2024/045", amount: 45.00, status: "PENDING", date: new Date().toISOString() }
    ],
    subscriptions: [
      { id: "sub-1", status: "ACTIVE", plan: { name: "Plano Wellness Gold", price: 29.90 } }
    ]
  };

  try {
    let customer = await prisma.owner.findUnique({
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
       return NextResponse.json(customer);
    }
    
    // Demo fallback logic
    if (id.startsWith("demo-") || id === "demo-owner-1") {
        return NextResponse.json(mockCustomer);
    }

    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  } catch (error) {
    console.error("Hub error, returning mock:", error);
    return NextResponse.json(mockCustomer);
  }
}
