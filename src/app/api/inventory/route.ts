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

  const { id, name, price, vatRate, stockQuantity, barcode, batchNumber, expiryDate, category, type } = body;
  const parsedStockQuantity = parseInt(stockQuantity) || 0;
  const parsedPrice = parseFloat(price) || 0;

  const existingByBarcode = !id && barcode
    ? await tenantPrisma.product.findFirst({
      where: { clinicId, barcode },
    })
    : null;

  try {
    if (id) {
      const updated = await tenantPrisma.product.update({
        where: { id },
        data: {
          stockQuantity: {
            increment: type === "IN" ? parsedStockQuantity : -parsedStockQuantity,
          },
        },
      });
      await tenantPrisma.stockMovement.create({
        data: { productId: id, type: type || "IN", quantity: stockQuantity, source: "manual" },
      });
      return NextResponse.json(updated);
    } else if (existingByBarcode) {
      const updated = await tenantPrisma.product.update({
        where: { id: existingByBarcode.id },
        data: {
          stockQuantity: {
            increment: parsedStockQuantity,
          },
          ...(name && { name }),
          ...(price !== undefined && { price: parsedPrice }),
          ...(vatRate !== undefined && { vatRate }),
          ...(batchNumber !== undefined && { batchNumber: batchNumber || null }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(category !== undefined && { category: category || null }),
        },
      });

      await tenantPrisma.stockMovement.create({
        data: {
          productId: existingByBarcode.id,
          type: "IN",
          quantity: parsedStockQuantity,
          source: "barcode-scan",
        },
      });

      return NextResponse.json(updated);
    } else {
      const product = await tenantPrisma.product.create({
        data: {
          clinicId,
          name,
          price: parsedPrice,
          vatRate: vatRate ?? 23,
          stockQuantity: parsedStockQuantity,
          barcode: barcode || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          category: category || null,
        },
      });
      return NextResponse.json(product);
    }
  } catch {
    return NextResponse.json({ error: "Inventory update failed" }, { status: 500 });
  }
});
