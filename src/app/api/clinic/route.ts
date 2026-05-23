import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const PATCH = withAuth(async ({ req, tenantPrisma, clinicId }) => {
  try {
    const body = await req.json();
    const { 
      name, 
      vatNumber, 
      email, 
      address, 
      phone,
      vendusApiKey 
    } = body;

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name,
        vatNumber,
        email,
        address,
        phone,
        vendusApiKey
      }
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    console.error("[CLINIC_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const GET = withAuth(async ({ tenantPrisma, clinicId }) => {
  try {
    const clinic = await tenantPrisma.clinic.findFirst({ where: { id: clinicId } });
    if (!clinic) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("[CLINIC_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
