export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays } from "date-fns";
import { withPortalSession } from "@/lib/auth-portal";

type PortalVaccination = {
  vaccineName: string;
  expiresAt: Date | null;
};

type PortalPatient = {
  name: string;
  vaccinations: PortalVaccination[];
};

export const GET = withPortalSession(async ({ portalSession }) => {
  try {
    const ownerId = portalSession.ownerId;
    const clinicId = portalSession.clinicId;

    if (!ownerId || !clinicId) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, clinicId },
      include: {
        patients: {
          where: { status: "ACTIVE" },
          include: {
            vaccinations: {
              orderBy: { appliedAt: "desc" },
              take: 10,
            },
            dewormings: {
              orderBy: { appliedAt: "desc" },
              take: 5,
            },
            vitalSigns: {
              orderBy: { date: "desc" },
              take: 1,
            },
            consultations: {
              orderBy: { date: "desc" },
              take: 5,
              include: {
                veterinarian: { select: { name: true } },
              },
            },
            prescriptions: {
              where: {
                OR: [
                  { validUntil: null },
                  { validUntil: { gte: new Date() } },
                ],
                status: "ACTIVE",
              },
              include: {
                items: true,
                veterinarian: { select: { name: true } },
              },
              orderBy: { date: "desc" },
              take: 5,
            },
            appointments: {
              where: {
                startTime: { gte: new Date() },
                status: { not: "CANCELLED" },
              },
              orderBy: { startTime: "asc" },
              take: 3,
              include: {
                clinic: { select: { name: true, phone: true, address: true } },
              },
            },
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    // Build vaccine alerts (expiring in 30 days or already expired)
    const in30Days = addDays(new Date(), 30);
    const vaccineAlerts = (owner.patients as PortalPatient[]).flatMap((patient) =>
      patient.vaccinations
        .filter((v) => v.expiresAt && v.expiresAt <= in30Days)
        .map((v) => ({
          patientName: patient.name,
          vaccineName: v.vaccineName,
          expiresAt: v.expiresAt,
          expired: v.expiresAt ? v.expiresAt < new Date() : false,
        }))
    );

    return NextResponse.json({
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
      },
      clinic: owner.clinic,
      patients: owner.patients,
      vaccineAlerts,
    });
  } catch (error) {
    console.error("[PORTAL_ME_GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
