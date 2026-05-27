import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-wrapper";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ownerQuerySchema = z.object({
  hasPhone: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  search: z.string().default(""),
});

export const GET = withRole("owners", "LER", async ({ req, clinicId, tenantPrisma }) => {
  const { searchParams } = req.nextUrl;
  const parsed = ownerQuerySchema.safeParse({
    hasPhone: searchParams.get("hasPhone") ?? undefined,
    limit: searchParams.get("limit") ?? 100,
    search: searchParams.get("search") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const hasPhone = parsed.data.hasPhone === "true";
  const limit = parsed.data.limit;
  const search = parsed.data.search;

  try {
    const where: Prisma.OwnerWhereInput = { clinicId };
    if (hasPhone) where.phone = { not: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const owners = await tenantPrisma.owner.findMany({
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
});
