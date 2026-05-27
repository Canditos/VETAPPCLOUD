import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ session }) => {
  const role = (session?.user as any)?.role;

  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const clinicCount = await prisma.clinic.count();
    return NextResponse.json({
      ok: true,
      clinicCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
