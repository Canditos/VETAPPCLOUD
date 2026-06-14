import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    // Obter o ID da clínica existente (assumimos que existe a default)
    let clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          name: "Clínica Gato Escondido",
          email: "geral@gatoescondido.com"
        }
      });
    }
    
    // Apagar todos os utilizadores existentes
    await prisma.user.deleteMany({});
    
    // Inserir os novos utilizadores
    const usersToCreate = [
      { name: "Super Admin", email: "admin@gatoescondido.com", role: "SUPER_ADMIN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Rita", email: "rita@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Carla", email: "carla@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dr. João", email: "joao@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Cláudia", email: "claudia@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Receção", email: "rec@gatoescondido.com", role: "RECEPTIONIST", passwordHash, clinicId: clinic.id }
    ];
    
    for (const u of usersToCreate) {
      // @ts-ignore
      await prisma.user.create({ data: u });
    }
    
    return NextResponse.json({ message: "Utilizadores atualizados com sucesso!", users: usersToCreate.map(u => ({ email: u.email, role: u.role })) });
  } catch (error: any) {
    console.error("Erro ao resetar users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
