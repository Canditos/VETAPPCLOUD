export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

// GET /api/inventory - List products
export const GET = withAuth(async ({ tenantPrisma }) => {
  try {
    const products = await tenantPrisma.product.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[INVENTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

// POST /api/inventory - Add or Update product stock
export const POST = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  const body = await req.json();

  const { id, name, price, stockQuantity, barcode, type } = body;

  try {
    if (id) {
      // Update stock movement manually
      const updated = await tenantPrisma.product.update({
        where: { id },
        data: {
          stockQuantity: {
            increment: type === "IN" ? stockQuantity : -stockQuantity,
          },
        },
      });

      await tenantPrisma.stockMovement.create({
        data: {
          productId: id,
          type: type || "IN",
          quantity: stockQuantity,
          source: "manual",
        },
      });

      return NextResponse.json(updated);
    } else {
      // Create new product
      const product = await tenantPrisma.product.create({
        data: {
          clinicId,
          name,
          price,
          stockQuantity,
          barcode,
        },
      });
      return NextResponse.json(product);
    }
  } catch (error) {
    return NextResponse.json({ error: "Inventory update failed" }, { status: 500 });
  }
});
