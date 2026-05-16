import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const RegisterSchema = z.object({
  clinic: z.object({
    name: z.string().min(3, "Nome da clínica deve ter pelo menos 3 caracteres"),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email da clínica inválido").optional().or(z.literal('')),
  }),
  admin: z.object({
    name: z.string().min(2, "Nome do administrador deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email do administrador inválido"),
    password: z.string().min(6, "A password deve ter pelo menos 6 caracteres"),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Dados inválidos", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { clinic, admin } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
