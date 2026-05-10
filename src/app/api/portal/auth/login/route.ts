import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios" }, { status: 400 });
    }

    // Encontra o cliente
    const owner = await prisma.owner.findFirst({
      where: { email },
    });

    if (!owner) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    if (!owner.passwordHash) {
      return NextResponse.json({ error: "Acesso não configurado. Contacte a clínica." }, { status: 401 });
    }

    // Verifica a password
    const isValid = await bcrypt.compare(password, owner.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Gera o token JWT para o portal
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "temp-fallback-secret-do-not-use-in-prod");
    const jwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    const response = NextResponse.json({ success: true, ownerId: owner.id });

    // Define o cookie (HTTPOnly)
    response.cookies.set("vet_portal_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[PORTAL_LOGIN]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
