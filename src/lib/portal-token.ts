import crypto from "crypto";
import prisma from "@/lib/prisma";

const DEFAULT_PORTAL_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type PortalTokenWithOwner = Awaited<ReturnType<typeof getPortalToken>>;

function isExpired(expiresAt: Date | null) {
  return !!expiresAt && expiresAt.getTime() < Date.now();
}

export async function issuePortalToken({
  ownerId,
  clinicId,
  expiresAt = new Date(Date.now() + DEFAULT_PORTAL_TOKEN_TTL_MS),
}: {
  ownerId: string;
  clinicId: string;
  expiresAt?: Date;
}) {
  await prisma.ownerPortalToken.deleteMany({
    where: { ownerId, clinicId },
  });

  return prisma.ownerPortalToken.create({
    data: {
      token: crypto.randomBytes(32).toString("hex"),
      ownerId,
      clinicId,
      expiresAt,
    },
  });
}

export async function getPortalToken(token: string) {
  return prisma.ownerPortalToken.findUnique({
    where: { token },
    include: { owner: true },
  });
}

export async function consumePortalToken(token: string): Promise<
  | { status: "invalid" | "expired" | "used" }
  | { status: "ok"; owner: NonNullable<PortalTokenWithOwner>["owner"] }
> {
  return prisma.$transaction(async (tx) => {
    const portalToken = await tx.ownerPortalToken.findUnique({
      where: { token },
      include: { owner: true },
    });

    if (!portalToken || portalToken.owner.clinicId !== portalToken.clinicId) {
      return { status: "invalid" as const };
    }

    if (isExpired(portalToken.expiresAt ?? null)) {
      await tx.ownerPortalToken.deleteMany({
        where: { token },
      });
      return { status: "expired" as const };
    }

    if (portalToken.lastUsed) {
      return { status: "used" as const };
    }

    await tx.ownerPortalToken.update({
      where: { id: portalToken.id },
      data: { lastUsed: new Date() },
    });

    return {
      status: "ok" as const,
      owner: portalToken.owner,
    };
  });
}
