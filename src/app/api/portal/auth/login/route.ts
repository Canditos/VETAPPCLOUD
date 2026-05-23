import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

type AttemptState = {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

const attemptsStore =
  (globalThis as any).__portalLoginAttempts ||
  ((globalThis as any).__portalLoginAttempts = new Map<string, AttemptState>());

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function buildAttemptKey(req: Request, email: string) {
  return `${getClientIp(req)}:${email.toLowerCase()}`;
}

function getRateLimitState(key: string) {
  const now = Date.now();
  const state = attemptsStore.get(key) as AttemptState | undefined;
  if (!state) return { blocked: false as const, retryAfter: 0 };

  if (state.blockedUntil && state.blockedUntil > now) {
    return { blocked: true as const, retryAfter: Math.ceil((state.blockedUntil - now) / 1000) };
  }

  if (now - state.firstAttemptAt > WINDOW_MS) {
    attemptsStore.delete(key);
  }

  return { blocked: false as const, retryAfter: 0 };
}

function registerFailure(key: string) {
  const now = Date.now();
  const current = attemptsStore.get(key) as AttemptState | undefined;

  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    attemptsStore.set(key, { attempts: 1, firstAttemptAt: now });
    return;
  }

  const attempts = current.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    attemptsStore.set(key, {
      attempts,
      firstAttemptAt: current.firstAttemptAt,
      blockedUntil: now + BLOCK_MS,
    });
    return;
  }

  attemptsStore.set(key, { ...current, attempts });
}

function clearFailures(key: string) {
  attemptsStore.delete(key);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios" }, { status: 400 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    const attemptKey = buildAttemptKey(req, email);
    const limit = getRateLimitState(attemptKey);
    if (limit.blocked) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    // Encontra o cliente
    const owner = await prisma.owner.findFirst({
      where: { email },
    });

    if (!owner) {
      registerFailure(attemptKey);
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    if (!owner.passwordHash) {
      registerFailure(attemptKey);
      return NextResponse.json({ error: "Acesso não configurado. Contacte a clínica." }, { status: 401 });
    }

    // Verifica a password
    const isValid = await bcrypt.compare(password, owner.passwordHash);

    if (!isValid) {
      registerFailure(attemptKey);
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    clearFailures(attemptKey);

    // Gera o token JWT para o portal
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
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
