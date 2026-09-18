export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/api-wrapper";
import { canAccess } from "@/lib/roles";

export const POST = withAuth(async ({ session, clinicId }) => {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_SETUP_USERS !== "true") {
      return NextResponse.json({ error: "Desativado em ambiente de produção para segurança dos dados." }, { status: 403 });
    }

    const role = (session.user as { role?: string })?.role;
    if (!canAccess("team", role, "CRUD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    const usersToCreate: Array<{ name: string; email: string; role: string }> = [
      { name: "Super Admin", email: "admin@gatoescondido.com", role: "SUPER_ADMIN" },
      { name: "Dra. Rita", email: "rita@gatoescondido.com", role: "VETERINARIAN" },
      { name: "Dra. Carla", email: "carla@gatoescondido.com", role: "VETERINARIAN" },
      { name: "Dr. João", email: "joao@gatoescondido.com", role: "VETERINARIAN" },
      { name: "Dra. Cláudia", email: "claudia@gatoescondido.com", role: "VETERINARIAN" },
      { name: "Receção", email: "rec@gatoescondido.com", role: "RECEPTIONIST" },
    ];

    const keepEmails = usersToCreate.map((u) => u.email);

    for (const u of usersToCreate) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role as never, passwordHash, name: u.name, clinicId },
        create: { ...u, role: u.role as never, passwordHash, clinicId },
      });
    }

    const adminUser = await prisma.user.findUnique({ where: { email: "admin@gatoescondido.com" } });

    if (adminUser) {
      await prisma.consultation.updateMany({
        where: { clinicId, veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id },
      });
      await prisma.hospitalization.updateMany({
        where: { clinicId, admissionBy: { email: { notIn: keepEmails } } },
        data: { admissionById: adminUser.id },
      });
      await prisma.hospitalizationTask.updateMany({
        where: { completedBy: { email: { notIn: keepEmails } } },
        data: { completedById: adminUser.id },
      });
      await prisma.vitalSign.updateMany({
        where: { clinicId, veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id },
      });
      await prisma.prescription.updateMany({
        where: { clinicId, veterinarian: { email: { notIn: keepEmails } } },
        data: { veterinarianId: adminUser.id },
      });
    }

    await prisma.user.deleteMany({
      where: { clinicId, email: { notIn: keepEmails } },
    });

    return NextResponse.json({
      message: "Utilizadores atualizados com sucesso!",
      users: usersToCreate.map((u) => ({ email: u.email, role: u.role })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao resetar users:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
