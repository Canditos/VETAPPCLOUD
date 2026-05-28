import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
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

function normalizeDescription(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function findRecentDuplicateInvoice(params: {
  tenantPrisma: PrismaClient;
  clinicId: string;
  ownerId: string;
  total: number;
  paymentMethod: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  idempotencyKey?: string;
}) {
  const {
    tenantPrisma,
    clinicId,
    ownerId,
    total,
    paymentMethod,
    description,
    quantity,
    unitPrice,
    vatRate,
    idempotencyKey,
  } = params;

  const windowMs = idempotencyKey ? 30 * 60 * 1000 : 5 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);
  const normalizedDescription = normalizeDescription(description);

  const recentInvoices = await tenantPrisma.invoice.findMany({
    where: {
      clinicId,
      ownerId,
      status: "PAID",
      paymentMethod,
      total,
      createdAt: { gte: windowStart },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    recentInvoices.find((invoice) =>
      invoice.items.some(
        (item) =>
          normalizeDescription(item.description || "") === normalizedDescription &&
          Number(item.quantity) === quantity &&
          Number(item.price) === unitPrice &&
          Number(item.vatRate) === vatRate,
      ),
    ) || null
  );
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
    const idempotencyKey = req.headers.get("x-idempotency-key")?.trim() || undefined;

    const duplicate = await findRecentDuplicateInvoice({
      tenantPrisma: tenantPrisma as PrismaClient,
      clinicId,
      ownerId: owner.id,
      total,
      paymentMethod,
      description,
      quantity,
      unitPrice,
      vatRate,
      idempotencyKey,
    });

    if (duplicate) {
      return NextResponse.json({ success: true, deduplicated: true, invoice: duplicate });
    }

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
    const vendusId = String(vendusDoc.id);
    const externalId = vendusDoc.number ? String(vendusDoc.number) : vendusDoc.reference ? String(vendusDoc.reference) : vendusId;

    let invoice;
    try {
      invoice = await tenantPrisma.invoice.create({
        data: {
          clinicId,
          ownerId: owner.id,
          total,
          status: "PAID",
          issuedAt: new Date(),
          paymentMethod,
          vendusId,
          externalId,
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existingInvoice = await tenantPrisma.invoice.findFirst({
          where: {
            clinicId,
            OR: [{ vendusId }, { externalId }],
          },
          include: { items: true },
        });

        if (existingInvoice) {
          return NextResponse.json({ success: true, deduplicated: true, invoice: existingInvoice });
        }
      }
      throw error;
    }

    return NextResponse.json({ success: true, deduplicated: false, invoice });
  } catch (error) {
    console.error("[CUSTOMER_MANUAL_INVOICE]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao emitir fatura" }, { status: 500 });
  }
});