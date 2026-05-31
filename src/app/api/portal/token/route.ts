export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { issuePortalToken } from "@/lib/portal-token";

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

  const portalToken = await issuePortalToken({ ownerId, clinicId });

  return NextResponse.json({ token: portalToken.token });
});
