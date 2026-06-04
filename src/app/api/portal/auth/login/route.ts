import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createRateLimiter, buildRateLimitKey, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxAttempts: 5 });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios" }, { status: 400 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    const rlKey = buildRateLimitKey(ip, email);
    const { allowed, retryAfter } = rateLimiter.check(rlKey);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const owner = await prisma.owner.findFirst({
      where: { email },
    });

    if (!owner) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    if (!owner.passwordHash) {
      return NextResponse.json({ error: "Acesso não configurado. Contacte a clínica." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, owner.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    rateLimiter.reset(rlKey);

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const jwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({ success: true, ownerId: owner.id });

    response.cookies.set("vet_portal_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[PORTAL_LOGIN]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
