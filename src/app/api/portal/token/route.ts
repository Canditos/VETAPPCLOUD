export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-wrapper";
import { SignJWT } from "jose";

export const POST = withRole("team", "CRIAR_LER", async ({ tenantPrisma, clinicId, req }) => {
  const body = await req.json();
  const { ownerId } = body as { ownerId: string };

  if (!ownerId) {
    return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
  }

  const owner = await tenantPrisma.owner.findFirst({
    where: {
      id: ownerId,
      clinicId,
    },
  });

  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Servidor mal configurado: NEXTAUTH_SECRET em falta" }, { status: 500 });
  }
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

  const token = await new SignJWT({
    ownerId: owner.id,
    clinicId,
    role: "OWNER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  await tenantPrisma.ownerPortalToken.create({
    data: {
      ownerId,
      clinicId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ token });
});
