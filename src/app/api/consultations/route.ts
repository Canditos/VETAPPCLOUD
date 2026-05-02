export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";
import { JasminService } from "@/lib/jasmin-service";
import { VendusService } from "@/lib/vendus-service";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicId = (session.user as any).clinicId;
  const tenantPrisma = getTenantClient(clinicId);
  const body = await req.json();

  const { 
    patientId, 
    appointmentId, 
    notes, 
    items, 
    billNow 
  } = body;

  try {
    // 1. Create Consultation in DB
    const consultation = await tenantPrisma.consultation.create({
      data: {
        patientId,
        veterinarianId: (session.user as any).id,
        date: new Date(),
        status: "COMPLETED",
        notes: {
          create: {
            subjective: notes.subjective,
            objective: notes.objective,
            assessment: notes.assessment,
            plan: notes.plan,
          }
        }
      },
    });

    // 2. Handle Billing (Jasmin or Vendus Integration)
    let externalInvoiceId = null;
    if (billNow && items && items.length > 0) {
      // Priority: Vendus (since user just provided the key)
      const clinic = await tenantPrisma.clinic.findUnique({ where: { id: clinicId } });
      const vendusKey = clinic?.vendusApiKey || "30727f657ce7768f31799399ec8b912d"; // Fallback from screenshot

      if (vendusKey) {
        const vendus = new VendusService(vendusKey);
        try {
          const vendusDoc = await vendus.createDocument({
            type: "FT", // Fatura
            date: new Date().toISOString().split('T')[0],
            client: { name: "Consumidor Final" }, // Placeholder
            items: items.map((it: any) => ({
              description: it.name || it.description,
              qty: it.quantity,
              gross_price: it.price,
              tax_id: it.vatRate === 23 ? "NOR" : it.vatRate === 13 ? "INT" : "RED"
            }))
          });
          externalInvoiceId = vendusDoc.id;
        } catch (vError) {
          console.error("Vendus Error:", vError);
        }
      } else if (clinic?.jasminApiKey) {
        // Fallback to Jasmin
        const jasmin = new JasminService(clinicId);
        // ... (Jasmin logic)
      }

      if (externalInvoiceId) {
        await tenantPrisma.invoice.create({
          data: {
            consultationId: consultation.id,
            clinicId,
            jasminInvoiceId: externalInvoiceId.toString(),
            total: items.reduce((acc: number, curr: any) => acc + (Number(curr.price) * curr.quantity), 0),
            status: "PAID"
          }
        });
      }
    }

    // 3. Update Appointment status if exists
    if (appointmentId) {
      await tenantPrisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" }
      });
    }

    return NextResponse.json({ 
      success: true, 
      consultationId: consultation.id,
      jasminInvoiceId
    });
  } catch (error) {
    console.error("Error creating consultation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
