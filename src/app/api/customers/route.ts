import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

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
      tenantPrisma.owner.findMany({
        where,
        include: {
          _count: { select: { patients: true, invoices: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      tenantPrisma.owner.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const POST = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const customer = await tenantPrisma.owner.create({
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

    return NextResponse.json(customer);
  } catch (error) {
    console.error("[CUSTOMERS_POST]", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Error";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
