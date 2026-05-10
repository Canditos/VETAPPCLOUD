export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addDays } from "date-fns";

// GET /api/portal/me?token=xxx — returns owner + all animals + upcoming data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token obrigatório" }, { status: 400 });
    }

    const portalToken = await prisma.ownerPortalToken.findUnique({
      where: { token },
      include: {
        owner: {
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
                  orderBy: { recordedAt: "desc" },
                  take: 1,
                },
                consultations: {
                  orderBy: { date: "desc" },
                  take: 5,
                  include: {
                    veterinarian: { select: { name: true } },
                    notes: { take: 1, select: { content: true, type: true } },
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

    if (!portalToken) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });
    }

    // Update last used
    await prisma.ownerPortalToken.update({
      where: { token },
      data: { lastUsed: new Date() },
    });

    // Build vaccine alerts (expiring in 30 days or already expired)
    const in30Days = addDays(new Date(), 30);
    const vaccineAlerts = portalToken.owner.patients.flatMap((patient) =>
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
        id: portalToken.owner.id,
        name: portalToken.owner.name,
        email: portalToken.owner.email,
        phone: portalToken.owner.phone,
      },
      clinic: portalToken.clinic,
      patients: portalToken.owner.patients,
      vaccineAlerts,
      token,
    });
  } catch (error) {
    console.error("[PORTAL_ME_GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
