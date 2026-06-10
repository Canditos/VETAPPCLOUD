import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { getPortalToken } from "@/lib/portal-token";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

async function loginViaToken(token: string) {
  const portalToken = await getPortalToken(token);
  if (!portalToken || portalToken.lastUsed) throw { status: 401, msg: "Token inválido ou já utilizado" };
  if (portalToken.expiresAt && new Date() > portalToken.expiresAt) throw { status: 401, msg: "Token expirado" };

  await prisma.portalToken.update({
    where: { id: portalToken.id },
    data: { lastUsed: new Date() },
  });

  return {
    ownerId: portalToken.ownerId,
    clinicId: portalToken.clinicId,
    owner: {
      id: portalToken.owner.id,
      name: portalToken.owner.name,
      email: portalToken.owner.email,
      phone: portalToken.owner.phone,
    },
  };
}

async function loginViaPassword(email: string, password: string) {
  if (!email || !password) throw { status: 400, msg: "Email e password obrigatórios" };

  const owner = await prisma.owner.findFirst({
    where: { email: email.trim().toLowerCase() },
    include: { clinic: { select: { name: true } } },
  });

  if (!owner) throw { status: 401, msg: "Credenciais inválidas" };
  if (!owner.passwordHash) throw { status: 401, msg: "Acesso não configurado. Contacte a clínica." };

  const isValid = await bcrypt.compare(password, owner.passwordHash);
  if (!isValid) throw { status: 401, msg: "Credenciais inválidas" };

  return {
    ownerId: owner.id,
    clinicId: owner.clinicId,
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    if (!secret) throw { status: 500, msg: "Configuração inválida" };

    let result;
    if (body.token) {
      result = await loginViaToken(body.token);
    } else if (body.email && body.password) {
      result = await loginViaPassword(body.email, body.password);
    } else {
      return NextResponse.json({ error: "Forneça um token de acesso ou email+password" }, { status: 400 });
    }

    const jwt = await new SignJWT({
      ownerId: result.ownerId,
      clinicId: result.clinicId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    return NextResponse.json({ jwt, owner: result.owner });
  } catch (error: any) {
    const status = error?.status || 500;
    const msg = error?.msg || "Erro interno";
    console.error("[MOBILE_LOGIN]", error);
    return NextResponse.json({ error: msg }, { status });
  }
}
