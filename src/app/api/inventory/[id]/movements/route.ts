export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const GET = withAuthParams(async ({ clinicId, tenantPrisma }, { id }) => {
  try {
    const movements = await tenantPrisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(movements);
  } catch (error) {
    console.error("[INVENTORY_MOVEMENTS_GET]", error);
    return NextResponse.json({ error: "Erro ao carregar movimentos" }, { status: 500 });
  }
});
