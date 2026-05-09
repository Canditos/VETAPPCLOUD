export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/hospitalization/tasks - Mark a task as completed or skipped
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const body = await req.json();
    const { taskId, status, notes } = body;

    if (!taskId || !["COMPLETED", "SKIPPED"].includes(status)) {
      return NextResponse.json({ error: "taskId e status válido são obrigatórios" }, { status: 400 });
    }

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
    console.error("[HOSPITALIZATION_TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
