export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { SignJWT } from "jose";

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
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

  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "temp-fallback-secret-do-not-use-in-prod"
  );

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
