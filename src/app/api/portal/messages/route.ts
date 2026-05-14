import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPortalSession } from "@/lib/auth-portal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Listar mensagens combinadas (Chat + Pedidos)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerIdParam = searchParams.get("ownerId");
  const requestIdParam = searchParams.get("requestId");
  
  // 1. Tentar Sessão Clínica
  const clinicSession = await getServerSession(authOptions);
  
  if (clinicSession && (clinicSession.user as any).clinicId) {
    const clinicId = (clinicSession.user as any).clinicId;
    
    // Buscar Mensagens de Chat
    const chatMessages = await prisma.portalMessage.findMany({
      where: { 
        clinicId,
        ...(ownerIdParam ? { ownerId: ownerIdParam } : {}),
        ...(requestIdParam ? { requestId: requestIdParam } : {})
      },
      include: {
        owner: { select: { name: true, email: true } }
      }
    });

    // Buscar Pedidos de Marcação (e converter para formato de "mensagem")
    const appointmentRequests = await prisma.portalAppointmentRequest.findMany({
      where: { 
        clinicId,
        ...(ownerIdParam ? { ownerId: ownerIdParam } : {}),
        ...(requestIdParam ? { id: requestIdParam } : {})
      },
      include: {
        owner: { select: { name: true, email: true } },
        patient: { select: { name: true } }
      }
    });

    // Unificar e formatar para o Inbox
    const combined = [
      ...chatMessages.map(m => ({
        ...m,
        type: "CHAT"
      })),
      ...appointmentRequests.map(r => ({
        id: r.id,
        content: `Pedido de Marcação para ${r.patient.name}: ${r.reason}`,
        createdAt: r.createdAt,
        senderType: "TUTOR",
        ownerId: r.ownerId,
        clinicId: r.clinicId,
        requestId: r.id,
        owner: r.owner,
        type: "APPOINTMENT_REQUEST"
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(combined);
  }

  // 2. Tentar Sessão Portal (Tutor)
  const portalSession = await getPortalSession();
  if (portalSession) {
    const messages = await prisma.portalMessage.findMany({
      where: { 
        clinicId: portalSession.clinicId,
        ownerId: portalSession.ownerId,
        ...(requestIdParam ? { requestId: requestIdParam } : {})
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(messages);
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

// POST: Enviar mensagem
export async function POST(req: Request) {
  const portalSession = await getPortalSession();
  if (!portalSession) return new NextResponse("Unauthorized", { status: 401 });

  const { content, requestId } = await req.json();

  const message = await prisma.portalMessage.create({
    data: {
      content,
      senderId: portalSession.ownerId,
      senderType: "TUTOR",
      clinicId: portalSession.clinicId,
      ownerId: portalSession.ownerId,
      requestId: requestId || null
    }
  });

  // Criar notificação para a clínica
  await prisma.notification.create({
    data: {
      clinicId: portalSession.clinicId,
      title: "💬 Nova Mensagem do Tutor",
      message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      type: "MESSAGE",
      ownerId: portalSession.ownerId,
      requestId: requestId || null,
      link: `/dashboard/appointments?ownerId=${portalSession.ownerId}`
    }
  });

  return NextResponse.json(message);
}
