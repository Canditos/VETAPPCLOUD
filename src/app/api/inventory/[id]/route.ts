export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuthParams } from "@/lib/api-wrapper";

export const PUT = withAuthParams(async ({ req, clinicId, tenantPrisma }, { id }) => {
  try {
    const existing = await tenantPrisma.product.findFirst({ where: { id, clinicId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { name, price, vatRate, stockQuantity, barcode, batchNumber, expiryDate, category } = body;

    const updated = await tenantPrisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(vatRate !== undefined && { vatRate }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(barcode !== undefined && { barcode }),
        ...(batchNumber !== undefined && { batchNumber }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(category !== undefined && { category }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[INVENTORY_PUT]", error);
    return NextResponse.json({ error: "Erro ao actualizar artigo" }, { status: 500 });
  }
});

export const DELETE = withAuthParams(async ({ clinicId, tenantPrisma }, { id }) => {
  try {
    const existing = await tenantPrisma.product.findFirst({ where: { id, clinicId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await tenantPrisma.stockMovement.deleteMany({ where: { productId: id } });
    await tenantPrisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INVENTORY_DELETE]", error);
    return NextResponse.json({ error: "Erro ao eliminar artigo" }, { status: 500 });
  }
});
