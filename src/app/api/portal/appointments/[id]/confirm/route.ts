import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPortalSession } from "@/lib/auth-portal";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getPortalSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const appointmentId = params.id;

  // 1. Verificar se a marcação pertence ao tutor e está pendente
  const appointment = await prisma.appointment.findFirst({
    where: { 
      id: appointmentId,
      patient: { ownerId: session.ownerId },
      status: "PENDING_CONFIRMATION"
    }
  });

  if (!appointment) {
    return new NextResponse("Marcação não encontrada ou já confirmada", { status: 404 });
  }

  // 2. Atualizar para SCHEDULED
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "SCHEDULED" }
  });

  // 3. Criar notificação para a clínica avisar que o tutor aceitou
  await prisma.notification.create({
    data: {
      clinicId: appointment.clinicId,
      title: "✅ Marcação Confirmada pelo Tutor",
      message: `O tutor confirmou o horário proposto para ${appointment.startTime.toLocaleTimeString()}.`,
      type: "INFO",
      link: `/dashboard/calendar`
    }
  });

  return NextResponse.json({ success: true });
}
