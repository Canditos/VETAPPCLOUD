export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

// GET /api/inventory — server-side paginated product listing
export const GET = withAuth(async ({ req, tenantPrisma }) => {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")));
    const search = (url.searchParams.get("search") ?? "").trim();
    const category = url.searchParams.get("category") ?? "";
    const sortKey = url.searchParams.get("sortKey") ?? "name";
    const sortDir = url.searchParams.get("sortDir") === "desc" ? "desc" : "asc";

    const validSortKeys = ["name", "category", "stockQuantity", "price", "expiryDate"];
    const orderBy = validSortKeys.includes(sortKey)
      ? { [sortKey]: sortDir }
      : { name: "asc" };

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category && category !== "all") {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      tenantPrisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      tenantPrisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[INVENTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

// POST /api/inventory — unchanged
export const POST = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  const body = await req.json();
  const { id, name, price, vatRate, stockQuantity, minStock, barcode, batchNumber, expiryDate, category, type } = body;

  try {
    if (id) {
      const updated = await tenantPrisma.product.update({
        where: { id },
        data: {
          stockQuantity: {
            increment: type === "IN" ? stockQuantity : -stockQuantity,
          },
        },
      });
      await tenantPrisma.stockMovement.create({
        data: { productId: id, type: type || "IN", quantity: stockQuantity, source: "manual" },
      });
      return NextResponse.json(updated);
    } else {
      const product = await tenantPrisma.product.create({
        data: {
          clinicId, name, price: parseFloat(price) || 0,
          vatRate: vatRate ?? 23,
          stockQuantity: parseInt(stockQuantity) || 0,
          minStock: minStock !== undefined ? parseInt(minStock) : 5,
          barcode: barcode || null,
          batchNumber: batchNumber || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          category: category || null,
        },
      });
      return NextResponse.json(product);
    }
  } catch (error) {
    return NextResponse.json({ error: "Inventory update failed" }, { status: 500 });
  }
});
