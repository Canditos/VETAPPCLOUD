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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const patients = await prisma.patient.findMany({
      where: { ownerId: session.ownerId, clinicId: session.clinicId },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        birthDate: true,
        color: true,
        weight: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("[PORTAL_PATIENTS]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
