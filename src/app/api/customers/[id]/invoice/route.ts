import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoleParams } from "@/lib/api-wrapper";
import { VendusService } from "@/lib/vendus-service";

export const dynamic = "force-dynamic";

const ManualInvoiceSchema = z.object({
  description: z.string().min(3, "Descricao obrigatoria"),
  quantity: z.number().int().positive("Quantidade invalida"),
  unitPrice: z.number().positive("Preco invalido"),
  vatRate: z.number().min(0).max(100),
  paymentMethod: z.string().min(1).default("CASH"),
});

function getVatField(vatRate: number) {
  if (vatRate === 6) return "vatTotal6" as const;
  if (vatRate === 13) return "vatTotal13" as const;
  return "vatTotal23" as const;
}

function getTaxCode(vatRate: number) {
  if (vatRate === 6) return "RED";
  if (vatRate === 13) return "INT";
  return "NOR";
}

function grossVatAmount(totalGross: number, vatRate: number) {
  if (!vatRate) return 0;
  return Number(((totalGross * vatRate) / (100 + vatRate)).toFixed(2));
}

export const POST = withRoleParams("owners", "CRIAR_LER", async ({ req, tenantPrisma, clinicId }, { id }) => {
  try {
    const parsed = ManualInvoiceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos", details: parsed.error.format() }, { status: 400 });
    }

    const owner = await tenantPrisma.owner.findFirst({
      where: { id, clinicId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }

    if (!owner.vatNumber) {
      return NextResponse.json({ error: "Cliente sem NIF. Atualize a ficha antes de faturar." }, { status: 400 });
    }

    const clinic = await tenantPrisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic?.vendusApiKey) {
      return NextResponse.json({ error: "Vendus nao configurado na clinica." }, { status: 400 });
    }

    const { description, quantity, unitPrice, vatRate, paymentMethod } = parsed.data;
    const total = Number((quantity * unitPrice).toFixed(2));
    const vendus = new VendusService(clinic.vendusApiKey);

    const clientData: Record<string, string> = {
      name: owner.name,
      vat: owner.vatNumber,
    };

    if (owner.email) clientData.email = owner.email;
    if (owner.address) clientData.address = owner.address;

    const vendusDoc = await vendus.createDocument({
      type: "FT",
      date: new Date().toISOString().split("T")[0],
      client: clientData,
      items: [
        {
          description,
          qty: quantity,
          gross_price: unitPrice,
          tax_id: getTaxCode(vatRate),
        },
      ],
    });

    if (owner.email) {
      try {
        await vendus.sendDocument(vendusDoc.id, owner.email);
      } catch (error) {
        console.warn("[MANUAL_INVOICE] Failed to send Vendus email:", error);
      }
    }

    const vatField = getVatField(vatRate);
    const vatAmount = grossVatAmount(total, vatRate);

    const invoice = await tenantPrisma.invoice.create({
      data: {
        clinicId,
        ownerId: owner.id,
        total,
        status: "PAID",
        issuedAt: new Date(),
        paymentMethod,
        vendusId: String(vendusDoc.id),
        externalId: vendusDoc.number ? String(vendusDoc.number) : vendusDoc.reference ? String(vendusDoc.reference) : String(vendusDoc.id),
        [vatField]: vatAmount,
        items: {
          create: [
            {
              description,
              quantity,
              price: unitPrice,
              vatRate,
            },
          ],
        },
        payments: {
          create: [
            {
              clinicId,
              ownerId: owner.id,
              amount: total,
              method: paymentMethod,
              paidAt: new Date(),
            },
          ],
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("[CUSTOMER_MANUAL_INVOICE]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao emitir fatura" }, { status: 500 });
  }
});