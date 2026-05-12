import { NextResponse } from "next/navigation";
import prisma from "@/lib/prisma";
import { getPortalSession } from "@/lib/auth-portal";

// GET: Listar mensagens
export async function GET(req: Request) {
  const session = await getPortalSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const messages = await prisma.portalMessage.findMany({
    where: { 
      clinicId: session.clinicId,
      ownerId: session.ownerId 
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(messages);
}

// POST: Enviar mensagem
export async function POST(req: Request) {
  const session = await getPortalSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { content, requestId } = await req.json();

  const message = await prisma.portalMessage.create({
    data: {
      content,
      senderId: session.ownerId,
      senderType: "TUTOR",
      clinicId: session.clinicId,
      ownerId: session.ownerId,
      requestId: requestId || null
    }
  });

  // Criar notificação para a clínica avisar que há nova mensagem
  await prisma.notification.create({
    data: {
      clinicId: session.clinicId,
      title: "💬 Nova Mensagem do Tutor",
      message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      type: "MESSAGE",
      ownerId: session.ownerId,
      requestId: requestId || null,
      link: `/dashboard/appointments?ownerId=${session.ownerId}`
    }
  });

  return NextResponse.json(message);
}
