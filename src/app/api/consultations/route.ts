/**
 * API ROUTE: /api/consultations
 *
 * Responsabilidade: Criar consultas, persistir notas SOAP e vitais,
 * e sincronizar faturação com Vendus (primário) ou Jasmin (legacy).
 *
 * Fluxo:
 *  1. Valida dados com Zod
 *  2. Cria consulta + notas clínicas + vitais
 *  3. Se billNow=true, emite fatura no Vendus e grava invoice local
 *  4. Envia email automático via Vendus se cliente tiver email
 *
 * Tenant: Sim, usa getTenantClient(clinicId)
 * Auth: Requer sessão com clinicId
 *
 * TODO: Adicionar suporte a orçamentos (Budget) antes de faturar
 * TODO: Permitir faturação em 2a instância (billNow=false, depois emitir)
 */

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma, { getTenantClient } from "@/lib/prisma";
import { JasminService } from "@/lib/jasmin-service";
import { VendusService } from "@/lib/vendus-service";

const ConsultationSchema = z.object({
  patientId: z.string().min(1, "ID do paciente é obrigatório"),
  appointmentId: z.string().optional(),
  notes: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }),
  vitals: z.object({
    weight: z.number().optional().nullable(),
    temperature: z.number().optional().nullable(),
    heartRate: z.number().optional().nullable(),
    respiratoryRate: z.number().optional().nullable(),
  }).optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    vatRate: z.number().nonnegative(),
  })).optional(),
  billNow: z.boolean().optional(),
  paymentMethod: z.string().optional(),
});

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

  // Validate request body
  const validation = ConsultationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ 
      error: "Dados inválidos", 
      details: validation.error.format() 
    }, { status: 400 });
  }

  const { 
    patientId, 
    appointmentId, 
    notes, 
    vitals,
    items, 
    billNow 
  } = validation.data;

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

    // 1.1. Create Vital Signs if provided
    if (vitals && (vitals.weight || vitals.temperature || vitals.heartRate || vitals.respiratoryRate)) {
      await tenantPrisma.vitalSigns.create({
        data: {
          patientId,
          clinicId,
          weight: vitals.weight,
          temperature: vitals.temperature,
          heartRate: vitals.heartRate,
          respiratoryRate: vitals.respiratoryRate,
          date: new Date(),
          veterinarianId: (session.user as any).id,
        }
      });
    }

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
        // Validation: NIF is mandatory for invoicing
        if (!patient?.owner?.vatNumber) {
          return NextResponse.json({ error: "Cliente sem NIF. Por favor atualize os dados do cliente antes de faturar." }, { status: 400 });
        }

        const vendus = new VendusService(vendusKey);
        try {
          // Construct client object with real data
          const clientData: any = {
            name: patient.owner.name,
            vat: patient.owner.vatNumber,
          };
          
          // Add email for automatic sending
          if (patient.owner.email) {
            clientData.email = patient.owner.email;
          }

          // Add address if available
          if (patient.owner.address) {
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

          // Automatic Email Sending via Vendus API
          if (patient.owner.email) {
            try {
              await vendus.sendDocument(externalInvoiceId, patient.owner.email);
            } catch (emailErr) {
              console.warn("Failed to auto-send email via Vendus:", emailErr);
              // We don't fail the invoice creation if email fails, just log it
            }
          } else {
            console.warn("No email found for client, skipping auto-send.");
          }

        } catch (vError) {
          console.error("Vendus Error:", vError);
          return NextResponse.json({ error: "Erro ao comunicar com Vendus. Verifique a API Key." }, { status: 500 });
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
