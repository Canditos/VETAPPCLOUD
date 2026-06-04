import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ clinicId }) => {

  // Criar uma notificação de teste
  const notification = await prisma.notification.create({
    data: {
      clinicId,
      title: "🧪 Teste de Mensagem",
      message: "Esta é uma mensagem de teste para verificar a campainha.",
      type: "MESSAGE",
      link: "/dashboard/appointments"
    }
  });

  return NextResponse.json({ success: true, notification });
});
