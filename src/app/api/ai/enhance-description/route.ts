import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import { anonymizeClinicalData, enhancePatientDescription } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export const POST = withAuth(async ({ tenantPrisma, clinicId, req }) => {
  try {
    const body = await req.json();
    const { patientId, text } = body;

    if (!patientId) {
      return NextResponse.json({ error: "patientId obrigatório" }, { status: 400 });
    }

    const patient = (await tenantPrisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: {
        consultations: {
          orderBy: { date: "desc" },
          take: 3,
          include: { notes: true },
        },
      },
    })) as any;

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const now = new Date();
    const anonymized = anonymizeClinicalData({
      patientName: patient.name,
      species: patient.species,
      gender: patient.gender === "M" ? "Macho" : "Fêmea",
      breed: patient.breed || "Indeterminada",
      ageText: patient.birthDate
        ? `${Math.floor((now.getTime() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} anos`
        : "Desconhecida",
      weight: patient.weight ? `${Number(patient.weight).toFixed(2)} kg` : null,
      lastConsultation: null,
      vaccines: { total: 0, expired: [], upcoming: [] },
      deworming: { overdue: false },
      allergies: patient.allergies,
      aggressionLevel: patient.aggressionLevel,
      microchip: patient.microchip,
      weightTrend: null,
      recommendations: [],
      recentConsultations: patient.consultations.map((c: any) => {
        const soap = [
          c.notes?.subjective ? `S: ${c.notes.subjective}` : "",
          c.notes?.objective ? `O: ${c.notes.objective}` : "",
          c.notes?.assessment ? `A: ${c.notes.assessment}` : "",
          c.notes?.plan ? `P: ${c.notes.plan}` : "",
        ].filter(Boolean).join("\n");
        return {
          date: c.date.toISOString(),
          SOAP: soap || null,
        };
      }),
    });

    const enhancedText = await enhancePatientDescription(text || "", anonymized);

    return NextResponse.json({ text: enhancedText });
  } catch (error) {
    console.error("[ENHANCE_DESCRIPTION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
