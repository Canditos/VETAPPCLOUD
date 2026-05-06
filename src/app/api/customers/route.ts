import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clinicId = "c1-demo-clinic";
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  try {
    const where: any = { clinicId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { vatNumber: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        include: {
          _count: { select: { patients: true, invoices: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.owner.count({ where }),
    ]);

    if (customers.length > 0) {
      return NextResponse.json({
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fallback: return demo data if database is empty
    return NextResponse.json({
      data: [
        {
          id: "demo-owner-1",
          name: "Ricardo Fonseca",
          email: "ricardo.fonseca@email.com",
          phone: "910 000 001",
          vatNumber: "234567890",
          address: "Rua dos Animais, 45, Setúbal",
          _count: { patients: 1, invoices: 1 },
        },
        {
          id: "demo-owner-2",
          name: "Ana Martins",
          email: "ana.martins@email.com",
          phone: "960 000 002",
          vatNumber: "123123123",
          address: "Urbanização das Flores, Palmela",
          _count: { patients: 1, invoices: 1 },
        },
      ],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({
      data: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clinicId = "c1-demo-clinic";

    if (!body.name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const customer = await prisma.owner.create({
      data: {
        clinicId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        vatNumber: body.vatNumber || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    });

    // Sincronização opcional com Jasmin se houver NIF
    if (body.vatNumber) {
      try {
        const { JasminService } = await import("@/lib/jasmin-service");
        const jasmin = new JasminService(clinicId);
        await jasmin.createCustomer({
          name: body.name,
          vatNumber: body.vatNumber,
          email: body.email,
          phone: body.phone,
          address: body.address
        });
        console.log(`[JASMIN] Cliente ${body.name} sincronizado com sucesso.`);
      } catch (err) {
        console.error("[JASMIN] Erro na sincronização automática:", err);
        // Não bloqueamos a criação local se o Jasmin falhar, mas logamos
      }
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
