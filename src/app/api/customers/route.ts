import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const clinicId = "c1-demo-clinic";

    const customers = await prisma.owner.findMany({
      where: {
        clinicId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: { patients: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (customers.length === 0) {
      return NextResponse.json([
        {
          id: "demo-owner-1",
          name: "Marco Cândido",
          email: "marco@example.com",
          phone: "912 345 678",
          address: "Rua Principal, 123",
          _count: { patients: 1 },
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-owner-2",
          name: "Ana Silva",
          email: "ana.silva@vet.pt",
          phone: "961 000 111",
          address: "Av. da Liberdade, 45",
          _count: { patients: 2 },
          createdAt: new Date().toISOString()
        }
      ]);
    }

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Erro ao carregar clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await prisma.owner.create({
      data: {
        clinicId: "c1-demo-clinic",
        name: body.name,
        email: body.email,
        phone: body.phone,
        vatNumber: body.vatNumber,
        address: body.address,
        notes: body.notes,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
