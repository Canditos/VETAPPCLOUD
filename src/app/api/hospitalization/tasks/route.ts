export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/hospitalization/tasks - Mark a task as completed or skipped
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Demo Fallback for stakeholders
  const clinicId = session ? (session.user as any).clinicId : "c1-demo-clinic";
  const userId = session ? (session.user as any).id : "admin-id";

  const body = await req.json();
  const { taskId, status, notes } = body;

  if (!taskId || !["COMPLETED", "SKIPPED"].includes(status)) {
    return NextResponse.json({ error: "taskId e status válido são obrigatórios" }, { status: 400 });
  }

  try {
    const task = await prisma.hospitalizationTask.update({
      where: { id: taskId },
      data: {
        status,
        notes: notes ?? undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        completedById: status === "COMPLETED" ? userId : undefined,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Falha ao atualizar tarefa" }, { status: 500 });
  }
}
