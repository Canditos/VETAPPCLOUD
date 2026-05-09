export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";
import { JasminService } from "@/lib/jasmin-service";
import { VendusService } from "@/lib/vendus-service";

export async function POST(req: Request) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }
  
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
    let provider = "VENDUS";

    if (billNow && items && items.length > 0) {
      // Fetch Patient and Owner details for the invoice
      const patient = await tenantPrisma.patient.findUnique({ 
        where: { id: patientId },
        include: { owner: true }
      });

      const clinic = await tenantPrisma.clinic.findUnique({ where: { id: clinicId } });
      const vendusKey = clinic?.vendusApiKey;

      if (vendusKey) {
        const vendus = new VendusService(vendusKey);
        try {
          // Construct client object with real data
          const clientData: any = {
            name: patient?.owner?.name || "Consumidor Final",
          };
          
          // Add VAT/NIF if available
          if (patient?.owner?.vatNumber) {
            clientData.vat = patient.owner.vatNumber;
          }
          
          // Add email for automatic sending later
          if (patient?.owner?.email) {
            clientData.email = patient.owner.email;
          }

          // Add address if available
          if (patient?.owner?.address) {
            clientData.address = patient.owner.address;
          }

          const vendusDoc = await vendus.createDocument({
            type: "FT", // Fatura
            date: new Date().toISOString().split('T')[0],
            client: clientData,
            items: items.map((it: any) => ({
              description: it.name || it.description,
              qty: it.quantity,
              gross_price: it.price,
              tax_id: it.vatRate === 23 ? "NOR" : it.vatRate === 13 ? "INT" : "RED"
            }))
          });
          externalInvoiceId = vendusDoc.id;
          provider = "VENDUS";
        } catch (vError) {
          console.error("Vendus Error:", vError);
        }
      } else if (clinic?.jasminApiKey) {
        // Fallback to Jasmin (Legacy)
        const jasmin = new JasminService(clinicId);
        // ... Jasmin logic would go here if still supported
        provider = "JASMIN";
      }

      const { paymentMethod = "CASH" } = body;

      if (externalInvoiceId) {
        await tenantPrisma.invoice.create({
          data: {
            consultationId: consultation.id,
            clinicId,
            ownerId: patient?.ownerId || "",
            vendusId: provider === "VENDUS" ? externalInvoiceId.toString() : null,
            jasminInvoiceId: provider === "JASMIN" ? externalInvoiceId.toString() : null,
            paymentMethod,
            total: items.reduce((acc: number, curr: any) => acc + (Number(curr.price) * curr.quantity), 0),
            status: "PAID",
            items: {
              create: items.map((it: any) => ({
                description: it.name || it.description,
                quantity: it.quantity,
                price: it.price,
                vatRate: it.vatRate
              }))
            }
          }
        });

        // Also record a payment record for the dashboard stats
        await tenantPrisma.payment.create({
          data: {
            clinicId,
            ownerId: patient?.ownerId || "",
            amount: items.reduce((acc: number, curr: any) => acc + (Number(curr.price) * curr.quantity), 0),
            method: paymentMethod,
            paidAt: new Date()
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
      invoiceId: externalInvoiceId
    });
  } catch (error) {
    console.error("Error creating consultation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
