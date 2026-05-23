export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

// GET /api/notifications — list + unread count
export const GET = withAuth(async ({ req, clinicId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const onlyUnread = searchParams.get("unread") === "true";

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          clinicId,
          ...(onlyUnread ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { clinicId, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});

// PATCH /api/notifications — mark one or all as read
export const PATCH = withAuth(async ({ req, clinicId }) => {
  try {
    const { id, markAllRead } = await req.json();

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { clinicId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      const result = await prisma.notification.updateMany({
        where: { id, clinicId },
        data: { isRead: true },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id ou markAllRead obrigatório" }, { status: 400 });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
});
