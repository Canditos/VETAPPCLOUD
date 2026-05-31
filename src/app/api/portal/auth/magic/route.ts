import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { createRateLimiter, buildRateLimitKey, getClientIp } from "@/lib/rate-limit";
import { consumePortalToken } from "@/lib/portal-token";

export const dynamic = "force-dynamic";

const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxAttempts: 10 });

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
    }

    const rlKey = buildRateLimitKey(ip, `magic:${token}`);
    const { allowed, retryAfter } = await rateLimiter.check(rlKey);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados pedidos. Tente novamente mais tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    const consumedToken = await consumePortalToken(token);
    if (consumedToken.status === "expired") {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }
    if (consumedToken.status === "used") {
      return NextResponse.json({ error: "Este link já foi utilizado. Peça um novo convite à clínica." }, { status: 401 });
    }
    if (consumedToken.status !== "ok") {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    const owner = consumedToken.owner;

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const jwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const requestedRedirect = searchParams.get("redirect") || "/portal/dashboard";

    const allowedRedirects = ["/portal/dashboard", "/portal/privacy", "/portal/appointments"];
    const redirectTo = allowedRedirects.includes(requestedRedirect)
      ? new URL(requestedRedirect, req.url)
      : new URL("/portal/dashboard", req.url);

    const consent = await prisma.privacyConsent.findFirst({
      where: { ownerId: owner.id, clinicId: owner.clinicId, accepted: true },
    });

    const finalUrl = !consent && !requestedRedirect.startsWith("/portal/privacy")
      ? new URL("/portal/privacy", req.url) : redirectTo;

    const response = NextResponse.redirect(finalUrl);

    response.cookies.set("vet_portal_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[PORTAL_MAGIC_LOGIN]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
