import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
    }

    // Encontra o token e o owner
    const portalToken = await prisma.ownerPortalToken.findUnique({
      where: { token },
      include: { owner: true },
    });

    if (!portalToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verifica se expirou
    if (portalToken.expiresAt && new Date() > portalToken.expiresAt) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }

    const owner = portalToken.owner;

    // Gera o token JWT para o portal (MESMA LÓGICA DO LOGIN)
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const jwt = await new SignJWT({ ownerId: owner.id, clinicId: owner.clinicId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Redireciona para o dashboard com o cookie setado
    const redirectUrl = new URL("/portal/dashboard", req.url);
    const response = NextResponse.redirect(redirectUrl);

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
    console.error("[PORTAL_MAGIC_LOGIN]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
