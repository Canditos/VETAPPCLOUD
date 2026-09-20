import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";

const AdjustStockSchema = z.object({
  productId: z.string().min(1, "ID do produto é obrigatório"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"], {
    errorMap: () => ({ message: "Tipo deve ser IN, OUT ou ADJUSTMENT" }),
  }),
  quantity: z.number().positive("A quantidade deve ser um número positivo").max(100000, "Quantidade excede o limite permitido"),
  source: z.string().max(150).optional(),
});

export const POST = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const rawBody = await req.json();
    const parsed = AdjustStockSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { productId, type, quantity, source } = parsed.data;

    // Verify tenant ownership to prevent IDOR
    const existingProduct = await tenantPrisma.product.findFirst({
      where: { id: productId, clinicId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado ou não pertence a esta clínica" },
        { status: 404 }
      );
    }

    const result = await tenantPrisma.$transaction(async (tx: any) => {
      // 1. Update product stock safely
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: {
            increment: type === "IN" ? quantity : -quantity,
          },
        },
      });

      // 2. Log movement associated with tenant
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          clinicId,
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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
