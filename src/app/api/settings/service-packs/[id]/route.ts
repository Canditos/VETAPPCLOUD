import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import { requireRole } from "@/lib/roles";

export const PATCH = withAuth(async (req: NextRequest, { params }: any) => {
  const session = await getServerSession(authOptions);
  requireRole(session?.user?.role, "settings", "CRIAR_LER");
  const { id } = params;
  const body = await req.json();
  const pack = await prisma.servicePack.update({
    where: { id, clinicId: session!.user!.clinicId },
    data: {
      name: body.name,
      type: body.type,
      active: body.active,
      items: body.items ? {
        deleteMany: {},
        create: body.items.map((it: any) => ({
          description: it.description,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice,
          vatRate: it.vatRate || 23,
        })),
      } : undefined,
    },
    include: { items: true },
  });
  return NextResponse.json(pack);
});

export const DELETE = withAuth(async (req: NextRequest, { params }: any) => {
  const session = await getServerSession(authOptions);
  requireRole(session?.user?.role, "settings", "CRUD");
  const { id } = params;
  await prisma.servicePack.delete({ where: { id, clinicId: session!.user!.clinicId } });
  return NextResponse.json({ success: true });
});
