import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
/* Prisma types via any */;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic, admin } = body;

    if (!clinic?.name || !admin?.name || !admin?.email || !admin?.password) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      );
    }

    if (admin.password.length < 6) {
      return NextResponse.json(
        { error: "A password deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const newClinic = await tx.clinic.create({
        data: {
          name: clinic.name,
          vatNumber: clinic.vatNumber || null,
          phone: clinic.phone || null,
          email: clinic.email || null,
        },
      });

      const passwordHash = await bcrypt.hash(admin.password, 10);

      const newUser = await tx.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          passwordHash,
          role: "ADMIN",
          clinicId: newClinic.id,
        },
      });

      await tx.automationSettings.create({
        data: {
          clinicId: newClinic.id,
        },
      });

      return { clinic: newClinic, user: newUser };
    });

    return NextResponse.json(
      {
        message: "Clínica criada com sucesso",
        clinicId: result.clinic.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER] Error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao criar conta" },
      { status: 500 }
    );
  }
}
