import { NextResponse } from "next/server";
import { withAuthParams } from "@/lib/api-wrapper";

export const PATCH = withAuthParams(async ({ req, tenantPrisma, clinicId }, { id }) => {
  try {
    // Verify the appointment belongs to this clinic (tenantPrisma injects clinicId)
    const existing = await tenantPrisma.appointment.findFirst({
      where: { id },
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
      const totalOverlapping = await tenantPrisma.appointment.count({
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
      const overlapping = await tenantPrisma.appointment.findFirst({
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

    const appointment = await tenantPrisma.appointment.update({
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
});

export const DELETE = withAuthParams(async ({ tenantPrisma }, { id }) => {
  try {
    // tenantPrisma injects clinicId automatically for findFirst
    const existing = await tenantPrisma.appointment.findFirst({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await tenantPrisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar marcação" }, { status: 500 });
  }
});
