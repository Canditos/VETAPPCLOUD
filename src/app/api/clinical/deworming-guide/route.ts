export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { matchDewormingGuide, findStockProduct, DEWORMING_GUIDE } from "@/lib/deworming-guide";

const toNumber = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

interface StockProduct {
  id: string;
  name: string;
  price: unknown;
  stockQuantity: number;
  batchNumber: string | null;
  expiryDate: Date | null;
}

export const GET = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const { searchParams } = new URL(req.url);

    let species = searchParams.get("species");
    let weightKg = toNumber(searchParams.get("weight"));
    let ageMonths = toNumber(searchParams.get("ageMonths"));
    const patientId = searchParams.get("patientId");

    // Se veio um paciente, auto-preenche os dados do animal.
    if (patientId) {
      const patient = await tenantPrisma.patient.findFirst({
        where: { id: patientId, clinicId },
        select: { species: true, weight: true, birthDate: true },
      });
      if (!patient) {
        return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
      }
      species = patient.species;
      weightKg = toNumber(patient.weight);
      if (patient.birthDate) {
        const months =
          (Date.now() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
        if (!Number.isNaN(months)) ageMonths = Math.round(months);
      }
    }

    const matches = matchDewormingGuide({ species, weightKg, ageMonths });

    // Produtos candidatos do inventário (match por tokens de nome).
    const tokens = Array.from(new Set(DEWORMING_GUIDE.flatMap((r) => r.stockTokens)));
    const products = (await tenantPrisma.product.findMany({
      where: {
        clinicId,
        OR: tokens.map((t) => ({ name: { contains: t, mode: "insensitive" as const } })),
      },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        batchNumber: true,
        expiryDate: true,
      },
    })) as StockProduct[];

    const results = matches.map((ref) => {
      const product = findStockProduct(ref, products);
      const price = product ? Number(product.price) : null;
      const pricePerMonth =
        price != null ? +(price / (ref.protectionMonths || 1)).toFixed(2) : null;

      return {
        ref,
        stock: product
          ? {
              productId: product.id,
              productName: product.name,
              price,
              pricePerMonth,
              inStock: product.stockQuantity > 0,
              stockQuantity: product.stockQuantity,
              batchNumber: product.batchNumber,
              expiryDate: product.expiryDate,
            }
          : null,
      };
    });

    return NextResponse.json({
      query: { species: species ?? null, weightKg, ageMonths },
      results,
      disclaimer:
        "Apoio à decisão — confirmar sempre com o médico veterinário. Doses indicativas com base no RCM.",
    });
  } catch (error) {
    console.error("[DEWORMING_GUIDE_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
