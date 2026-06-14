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
    
    // Inserir ou atualizar os novos utilizadores
    const usersToCreate = [
      { name: "Super Admin", email: "admin@gatoescondido.com", role: "SUPER_ADMIN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Rita", email: "rita@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Carla", email: "carla@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dr. João", email: "joao@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Dra. Cláudia", email: "claudia@gatoescondido.com", role: "VETERINARIAN", passwordHash, clinicId: clinic.id },
      { name: "Receção", email: "rec@gatoescondido.com", role: "RECEPTIONIST", passwordHash, clinicId: clinic.id }
    ];
    
    const keepEmails = usersToCreate.map(u => u.email);
    
    // 1. Criar ou Atualizar os utilizadores pedidos
    for (const u of usersToCreate) {
      // @ts-ignore
      await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role as any, passwordHash, name: u.name },
        create: { ...u, role: u.role as any }
      });
    }

    // O admin passa a ser o fallback para registos de utilizadores que vamos apagar
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@gatoescondido.com" } });

    if (adminUser) {
      // Reatribuir dados órfãos ao Admin antes de apagar
      await prisma.consultation.updateMany({
        where: { veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id }
      });
      await prisma.hospitalization.updateMany({
        where: { admissionBy: { email: { notIn: keepEmails } } },
        data: { admissionById: adminUser.id }
      });
      await prisma.hospitalizationTask.updateMany({
        where: { completedBy: { email: { notIn: keepEmails } } },
        data: { completedById: adminUser.id }
      });
      await prisma.vitalSign.updateMany({
        where: { veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id }
      });
      await prisma.prescription.updateMany({
        where: { veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id }
      });
    }

    // 2. Apagar os outros utilizadores
    await prisma.user.deleteMany({
      where: {
        email: { notIn: keepEmails }
      }
    });
    
    return NextResponse.json({ message: "Utilizadores atualizados com sucesso!", users: usersToCreate.map(u => ({ email: u.email, role: u.role })) });
  } catch (error: any) {
    console.error("Erro ao resetar users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
