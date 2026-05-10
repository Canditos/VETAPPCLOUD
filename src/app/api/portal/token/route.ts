export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/portal/token — generate or get existing portal token for an owner
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const { ownerId } = await req.json();

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId obrigatório" }, { status: 400 });
    }

    // Verify owner belongs to this clinic
    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, clinicId },
    });
    if (!owner) {
      return NextResponse.json({ error: "Proprietário não encontrado" }, { status: 404 });
    }

    // Upsert token — reuse existing one if valid
    const existing = await prisma.ownerPortalToken.findFirst({
      where: { ownerId, clinicId },
    });

    if (existing) {
      await prisma.ownerPortalToken.update({
        where: { id: existing.id },
        data: { lastUsed: new Date() },
      });
      return NextResponse.json({ token: existing.token, ownerId, ownerName: owner.name });
    }

    const newToken = await prisma.ownerPortalToken.create({
      data: { ownerId, clinicId },
    });

    return NextResponse.json({ token: newToken.token, ownerId, ownerName: owner.name });
  } catch (error) {
    console.error("[PORTAL_TOKEN_POST]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
