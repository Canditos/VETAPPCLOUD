export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withRoleParams } from "@/lib/api-wrapper";
import { canDelete } from "@/lib/roles";

export const PUT = withRoleParams("inventory", "CRIAR_LER", async ({ req, clinicId, tenantPrisma }, { id }) => {
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

export const DELETE = withRoleParams("inventory", "CRIAR_LER", async ({ clinicId, tenantPrisma, session }, { id }) => {
  try {
    const userRole = (session.user as { role?: string }).role;
    if (!userRole || !canDelete("inventory", userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
