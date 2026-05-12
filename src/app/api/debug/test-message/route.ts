import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const clinicId = (session.user as any).clinicId;

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
}
