export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { AnnualInventoryPDF } from "@/components/reports/AnnualInventoryPDF";

export const GET = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } });
    const products = await tenantPrisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const year = new Date().getFullYear();
    const stream = await renderToStream(
      React.createElement(AnnualInventoryPDF, {
        products: products.map((p: any) => ({
          name: p.name, category: p.category, stockQuantity: p.stockQuantity,
          price: p.price.toString(), vatRate: p.vatRate,
          expiryDate: p.expiryDate?.toISOString() ?? null,
          barcode: p.barcode,
        })),
        clinicName: clinic?.name ?? "Clínica",
        year,
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="inventario-anual-${year}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[ANNUAL_INVENTORY]", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
});
