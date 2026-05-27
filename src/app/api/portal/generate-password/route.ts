import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { withRole } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withRole("team", "CRIAR_LER", async ({ req, clinicId }) => {
  try {
    const { ownerId, manualPassword } = await req.json();

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId obrigatório" }, { status: 400 });
    }

    if (manualPassword && (typeof manualPassword !== "string" || manualPassword.length < 6)) {
      return NextResponse.json({ error: "manualPassword deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, clinicId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Generate secure random temporary password if none provided
    let password = manualPassword;
    if (!password) {
      password = crypto.randomBytes(12).toString("base64url");
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
});
