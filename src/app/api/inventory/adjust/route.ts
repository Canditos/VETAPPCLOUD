import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async ({ req, tenantPrisma }) => {
  try {
    const body = await req.json();

    const { productId, type, quantity, source } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await tenantPrisma.$transaction(async (tx: any) => {
      // 1. Update product stock
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: {
            increment: type === "IN" ? quantity : -quantity,
          },
        },
      });

      // 2. Log movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          source: source || "Manual Adjustment",
        },
      });

      return { product, movement };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[INVENTORY_ADJUST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
