import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const { searchParams } = new URL(req.url);
  const hasPhone = searchParams.get("hasPhone") === "true";
  const limit = parseInt(searchParams.get("limit") || "100");
  const search = searchParams.get("search") || "";

  try {
    const where: any = { clinicId };
    if (hasPhone) where.phone = { not: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const owners = await prisma.owner.findMany({
      where,
      include: { _count: { select: { patients: true } } },
      orderBy: { name: "asc" },
      take: limit,
    });

    return NextResponse.json(
      owners.map((o) => ({
        id: o.id,
        name: o.name,
        phone: o.phone,
        email: o.email,
        patientsCount: o._count.patients,
      }))
    );
  } catch (error) {
    console.error("[OWNERS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
