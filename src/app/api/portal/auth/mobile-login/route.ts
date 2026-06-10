import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { getPortalToken } from "@/lib/portal-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
    }

    const portalToken = await getPortalToken(token);
    if (!portalToken || portalToken.lastUsed) {
      return NextResponse.json({ error: "Token inválido ou já utilizado" }, { status: 401 });
    }
    if (portalToken.expiresAt && new Date() > portalToken.expiresAt) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    if (!secret) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    const jwt = await new SignJWT({
      ownerId: portalToken.ownerId,
      clinicId: portalToken.clinicId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Mark token as used
    await prisma.portalToken.update({
      where: { id: portalToken.id },
      data: { lastUsed: new Date() },
    });

    return NextResponse.json({
      jwt,
      owner: {
        id: portalToken.owner.id,
        name: portalToken.owner.name,
        email: portalToken.owner.email,
        phone: portalToken.owner.phone,
      },
    });
  } catch (error) {
    console.error("[MOBILE_LOGIN]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
