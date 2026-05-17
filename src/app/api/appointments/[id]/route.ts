import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicId = (session.user as any).clinicId;

    // Verify the appointment belongs to this clinic
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { startTime, endTime, veterinarianId, status } = await req.json();

    // When rescheduling via drag, preserve the original duration if endTime not supplied
    let computedEndTime = endTime ? new Date(endTime) : undefined;
    if (startTime && !endTime && existing.endTime) {
      const durationMs = existing.endTime.getTime() - existing.startTime.getTime();
      computedEndTime = new Date(new Date(startTime).getTime() + durationMs);
    }

    const newStartTime = startTime ? new Date(startTime) : existing.startTime;
    const newEndTime = computedEndTime || existing.endTime;
    const newVeterinarianId = veterinarianId || existing.veterinarianId;

    // Verificação de sobreposição global e específica
    if (status !== "CANCELLED") {
      // Limite global: Máximo de 5 consultas na mesma clínica em simultâneo
      const totalOverlapping = await prisma.appointment.count({
        where: {
          id: { not: id },
          status: { not: "CANCELLED" },
          OR: [
            {
              startTime: { lt: newEndTime },
              endTime: { gt: newStartTime },
            }
          ],
        },
      });

      if (totalOverlapping >= 5) {
        return NextResponse.json(
          { error: "Limite máximo de 5 consultas em simultâneo na clínica atingido." },
          { status: 400 }
        );
      }

      // Verificação específica: O membro não pode ter outra marcação na mesma hora
      const overlapping = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          veterinarianId: newVeterinarianId,
          status: { not: "CANCELLED" },
          OR: [
            {
              startTime: { lt: newEndTime },
              endTime: { gt: newStartTime },
            }
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: "O membro da equipa selecionado já tem uma marcação nesse horário." },
          { status: 400 }
        );
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(computedEndTime && { endTime: computedEndTime }),
        ...(veterinarianId && { veterinarianId }),
        ...(status && { status }),
      },
      include: {
        patient: { include: { owner: true } },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return NextResponse.json({ error: "Erro ao atualizar marcação" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clinicId = (session.user as any).clinicId;

    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar marcação" }, { status: 500 });
  }
}
