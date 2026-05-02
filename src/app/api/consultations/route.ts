export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma, { getTenantClient } from "@/lib/prisma";
import { JasminService } from "@/lib/jasmin-service";

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

    // 2. Handle Billing (Jasmin Integration)
    let jasminInvoiceId = null;
    if (billNow && items && items.length > 0) {
      const jasmin = new JasminService(clinicId);
      
      // In a real scenario, we would map internal products to Jasmin item keys
      const jasminItems = items.map((item: any) => ({
        itemKey: item.id.substring(0, 8), // Simulating mapping
        quantity: item.quantity,
        unitPrice: item.price
      }));

      try {
        const invoice = await jasmin.createInvoice({
          customerKey: "CLIENT_GENERIC", // Should come from patient/owner mapping
          items: jasminItems
        });
        
        jasminInvoiceId = invoice.id;

        // Create internal Invoice record
        await tenantPrisma.invoice.create({
          data: {
            consultationId: consultation.id,
            clinicId,
            externalId: jasminInvoiceId,
            total: items.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0),
            status: "PAID"
          }
        });
      } catch (jasminError) {
        console.error("Jasmin API Error:", jasminError);
        // We still return success for the consultation, but warn about billing
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
