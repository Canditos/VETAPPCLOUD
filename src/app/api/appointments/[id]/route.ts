import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { startTime, endTime, veterinarianId } = await req.json();
    const { id } = params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(veterinarianId && { veterinarianId }),
      },
      include: {
        patient: {
          include: {
            owner: true
          }
        }
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return NextResponse.json({ error: "Erro ao atualizar marcação" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.appointment.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar marcação" }, { status: 500 });
  }
}
