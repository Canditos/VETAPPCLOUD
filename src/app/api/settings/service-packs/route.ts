import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { requireRole } from "@/lib/roles";

export const GET = withAuth(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  requireRole(session?.user?.role, "settings", "LER");
  const packs = await prisma.servicePack.findMany({
    where: { clinicId: session!.user!.clinicId },
    include: { items: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(packs);
});

export const POST = withAuth(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  requireRole(session?.user?.role, "settings", "CRIAR_LER");
  const body = await req.json();
  const pack = await prisma.servicePack.create({
    data: {
      clinicId: session!.user!.clinicId,
      name: body.name,
      type: body.type,
      items: {
        create: (body.items || []).map((it: any) => ({
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate || 23,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(pack);
});
