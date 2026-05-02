import { NextRequest, NextResponse } from "next/server";
import { getTenantClient } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json([]);
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getTenantClient(session.user.clinicId);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  const customers = await prisma.owner.findMany({
    where: {
      clinicId: session.user.clinicId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
        { vatNumber: { contains: query } },
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

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getTenantClient(session.user.clinicId);
  const body = await req.json();

  try {
    const customer = await prisma.owner.create({
      data: {
        clinicId: session.user.clinicId,
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
