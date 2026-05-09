import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { clinicId: true }
    });

    if (!user?.clinicId) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

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
      where: { id: user.clinicId },
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
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { clinic: true }
    });

    if (!user?.clinic) {
      return new NextResponse("Clinic not found", { status: 404 });
    }

    return NextResponse.json(user.clinic);
  } catch (error) {
    console.error("[CLINIC_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
