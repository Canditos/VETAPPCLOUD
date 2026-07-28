/**
 * API ROUTE: POST /api/gdt/fazer-rx
 *
 * Responsabilidade: Gerar ficheiro GDT 6302 ("Fazer RX").
 * Escreve automaticamente na pasta gdtin (Samba share) para o Examion ler.
 * Tambem devolve o ficheiro para download.
 *
 * Tenant: Sim
 * Auth: Requer sessao
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { z } from "zod";
import { autoSendWorklist } from "@/lib/gdt";

const Schema = z.object({
  patientId: z.string().min(1),
  modality: z.enum(["XRAY01", "DICO01"]).optional(),
});

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  const body = await req.json();
  const validation = Schema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: validation.error.format() },
      { status: 400 }
    );
  }

  const { patientId, modality } = validation.data;

  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: { owner: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado" }, { status: 404 });
  }

  const result = autoSendWorklist({
    patient: {
      patientId: patient.id.substring(0, 10),
      name: patient.name,
      species: patient.species,
      breed: patient.breed || undefined,
      birthDate: patient.birthDate,
      coatColor: patient.coatColor || undefined,
      gender: patient.gender,
      neutered:
        patient.reproductiveStatus === "NEUTERED" ? true
        : patient.reproductiveStatus === "INTACT" ? false
        : null,
      microchip: patient.microchip || undefined,
    },
    owner: patient.owner
      ? {
          ownerId: patient.owner.id,
          lastName: patient.owner.name?.split(" ").pop() || patient.owner.name,
          firstName: patient.owner.name?.split(" ").slice(0, -1).join(" ") || undefined,
          phone: patient.owner.phone || undefined,
          email: patient.owner.email || undefined,
          street: patient.owner.address || undefined,
        }
      : undefined,
    modality: modality || "XRAY01",
  });

  const gdtContent = result.written ? undefined : result.buffer.toString("base64");

  return NextResponse.json({
    success: true,
    message: result.written
      ? `Ficheiro enviado para ${result.target || "Examion"} (${result.path})`
      : "Nenhum PC RX online. Ficheiro pronto para download manual.",
    written: result.written,
    target: result.target,
    path: result.path,
    filename: result.filename,
    encoding: result.encoding,
    attempts: result.rxAttempts,
    gdtContent,
  });
});
