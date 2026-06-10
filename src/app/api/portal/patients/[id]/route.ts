import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

async function getSession(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(auth.slice(7), secret);
    return payload as { ownerId: string; clinicId: string };
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, ownerId: session.ownerId, clinicId: session.clinicId },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        birthDate: true,
        color: true,
        weight: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("[PORTAL_PATIENT_DETAIL]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
