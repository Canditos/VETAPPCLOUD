import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma, { getTenantClient } from "@/lib/prisma";
import { JasminService } from "@/services/jasmin";

// POST /api/consultations - Complete a consultation and handle inventory/billing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const veterinarianId = (session.user as any).id;
  const tenantPrisma = getTenantClient(clinicId);
  const body = await req.json();

  const { 
    patientId, 
    notes, 
    items, 
    billNow 
  } = body;

  try {
    const result = await tenantPrisma.$transaction(async (tx) => {
      // 1. Create Consultation (clinicId injected automatically)
      const consultation = await tx.consultation.create({
        data: {
          patientId,
          veterinarianId,
          status: "COMPLETED",
          notes: {
            create: {
              subjective: notes.subjective,
              objective: notes.objective,
              assessment: notes.assessment,
              plan: notes.plan,
            },
          },
        },
      });

      // 2. Handle Inventory & Items
      let totalAmount = 0;
      const invoiceItems = [];

      for (const item of items) {
        // Update stock if it's a product
        if (item.productId) {
          const product = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              source: `consultation_${consultation.id}`,
            },
          });
        }

        totalAmount += Number(item.price) * item.quantity;
        invoiceItems.push({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // 3. Create Internal Invoice Draft
      const invoice = await tx.invoice.create({
        data: {
          consultationId: consultation.id,
          total: totalAmount,
          status: billNow ? "SENDING" : "DRAFT",
          items: {
            create: invoiceItems,
          },
        },
      });

      return { consultation, invoice };
    });

    // 4. Async Jasmin Integration (If billNow is true)
    // In a real production app, this should be a background job/queue
    if (billNow) {
      // This is a simplified call - would need clinic's Jasmin credentials from DB
      console.log("Triggering Jasmin API for invoice:", result.invoice.id);
      // const jasmin = new JasminService(...);
      // await jasmin.createInvoice(...);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Consultation Error:", error);
    return NextResponse.json({ error: "Failed to process consultation" }, { status: 500 });
  }
}
