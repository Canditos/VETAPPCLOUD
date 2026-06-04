import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuthParams } from "@/lib/api-wrapper";

export const PATCH = withAuthParams(async ({ clinicId }, { id }) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id, clinicId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATION_READ_PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
