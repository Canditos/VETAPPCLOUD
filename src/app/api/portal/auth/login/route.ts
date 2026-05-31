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
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios" }, { status: 400 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    const rlKey = buildRateLimitKey(ip, email);
    const { allowed, retryAfter } = await rateLimiter.check(rlKey);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const owners = await prisma.owner.findMany({
      where: { email },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    if (owners.length === 0) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    if (owners.length > 1) {
      return NextResponse.json(
        { error: "Este email está associado a mais do que uma clínica. Contacte a clínica para concluir o acesso ao portal." },
        { status: 409 }
      );
    }

    const [owner] = owners;

    if (!owner.passwordHash) {
      return NextResponse.json({ error: "Acesso não configurado. Contacte a clínica." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, owner.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    await rateLimiter.reset(rlKey);

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
