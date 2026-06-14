import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== "fix-me-now") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all clinics and their patient count
    const clinics = await prisma.clinic.findMany({
      include: {
        _count: {
          select: { patients: true }
        }
      }
    });

    // Find the clinic with the most patients
    let maxClinic = clinics[0];
    for (const clinic of clinics) {
      if (clinic._count.patients > (maxClinic?._count.patients || 0)) {
        maxClinic = clinic;
      }
    }

    if (!maxClinic) {
      return NextResponse.json({ message: "No clinics found" });
    }

    // Update the admin user to be in the max clinic
    await prisma.user.updateMany({
      where: {
        email: "admin@gatoescondido.com"
      },
      data: {
        clinicId: maxClinic.id
      }
    });

    return NextResponse.json({
      message: `Admin moved to clinic ${maxClinic.name} (has ${maxClinic._count.patients} patients)`,
      allClinics: clinics.map(c => ({ id: c.id, name: c.name, patients: c._count.patients }))
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
