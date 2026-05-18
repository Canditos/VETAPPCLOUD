export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where: any = { clinicId };

  if (role) {
    where.role = role;
  }

  const users = await tenantPrisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
});
