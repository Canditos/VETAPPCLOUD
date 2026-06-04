'use server';

import { withAuth } from '@/lib/api-wrapper';
import type { ApiContext } from '@/lib/api-wrapper';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PatientHistoryInput = {
  patientId: string;
};

export const GET = withAuth(async ({ tenantPrisma, clinicId }: ApiContext, _opts: { params: Promise<PatientHistoryInput> }) => {
  const { patientId } = await _opts.params;

  const [patient, lastConsultation, vaccinations, vitalSigns] = await Promise.all([
    tenantPrisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: { owner: true },
    }),
    tenantPrisma.consultation.findFirst({
      where: { patientId, clinicId },
      include: { clinicalNote: true, veterinarian: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    }),
    tenantPrisma.vaccination.findMany({
      where: { patientId, clinicId },
      orderBy: { appliedAt: 'desc' },
      take: 20,
    }),
    tenantPrisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  return NextResponse.json({
    patient,
    lastConsultation,
    vaccinations,
    vitalSigns,
  });
});
