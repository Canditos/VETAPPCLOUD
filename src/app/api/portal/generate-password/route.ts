import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const { ownerId, manualPassword } = await req.json();

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId obrigatório" }, { status: 400 });
    }

    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, clinicId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Generate random 6-char password if none provided
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let password = manualPassword;
    if (!password) {
      password = "";
      for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.owner.update({
      where: { id: owner.id },
      data: { passwordHash },
    });

    return NextResponse.json({ 
      success: true, 
      password, 
      email: owner.email 
    });

  } catch (error) {
    console.error("[GENERATE_PASSWORD]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
