export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async ({ req, tenantPrisma }) => {
  try {
    const body = await req.json();
    const { hospitalizationId, description, scheduledTime } = body;

    if (!hospitalizationId || !description || !scheduledTime) {
      return NextResponse.json({ error: "hospitalizationId, description e scheduledTime são obrigatórios" }, { status: 400 });
    }

    const hosp = await tenantPrisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true },
    });

    if (!hosp) {
      return NextResponse.json({ error: "Hospitalization not found" }, { status: 404 });
    }

    const task = await tenantPrisma.hospitalizationTask.create({
      data: {
        hospitalizationId,
        description,
        scheduledTime: new Date(scheduledTime),
        status: "PENDING",
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[HOSPITALIZATION_TASK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});

export const PATCH = withAuth(async ({ req, userId, tenantPrisma }) => {
  try {
    const body = await req.json();
    const { taskId, status, notes } = body;

    if (!taskId || !["COMPLETED", "SKIPPED"].includes(status)) {
      return NextResponse.json({ error: "taskId e status válido são obrigatórios" }, { status: 400 });
    }

    const task = await tenantPrisma.hospitalizationTask.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await tenantPrisma.hospitalizationTask.update({
      where: { id: taskId },
      data: {
        status,
        notes: notes ?? undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        completedById: status === "COMPLETED" ? userId : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[HOSPITALIZATION_TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
});
