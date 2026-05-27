import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withPortalSession } from "@/lib/auth-portal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ClinicUserSession = {
  clinicId?: string;
};

type ChatMessage = {
  id: string;
  createdAt: Date;
  ownerId: string;
  clinicId: string;
  requestId: string | null;
  content: string;
  senderType: string;
  owner: {
    name: string;
    email: string;
  };
};

type AppointmentRequestMessage = {
  id: string;
  createdAt: Date;
  ownerId: string;
  clinicId: string;
  reason: string;
  status: string;
  preferred: string | null;
  owner: {
    name: string;
    email: string;
  };
  patient: {
    name: string;
  };
};

// GET: Listar mensagens combinadas (Chat + Pedidos)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerIdParam = searchParams.get("ownerId");
  const requestIdParam = searchParams.get("requestId");
  
  // 1. Tentar Sessão Clínica
  const clinicSession = await getServerSession(authOptions);
  const clinicUser = clinicSession?.user as ClinicUserSession | undefined;
  
  if (clinicSession && clinicUser?.clinicId) {
    const clinicId = clinicUser.clinicId;
    
    // Buscar Mensagens de Chat
    const chatMessages = await prisma.portalMessage.findMany({
      where: { 
        clinicId,
        ...(ownerIdParam ? { ownerId: ownerIdParam } : {}),
        ...(requestIdParam ? { requestId: requestIdParam } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        owner: { select: { name: true, email: true } },
        patient: { select: { name: true } }
      }
    });

    const combined = [
      ...chatMessages.map((m: ChatMessage) => ({
        ...m,
        type: "CHAT"
      })),
      ...appointmentRequests.map((r: AppointmentRequestMessage) => ({
        id: r.id,
        content: `Pedido de Marcação para ${r.patient.name}: ${r.reason}`,
        createdAt: r.createdAt,
        senderType: "TUTOR",
        ownerId: r.ownerId,
        clinicId: r.clinicId,
        requestId: r.id,
        owner: r.owner,
        type: "APPOINTMENT_REQUEST",
        status: r.status,
        patientName: r.patient.name,
        preferred: r.preferred
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(combined);
  }

  // 2. Sessão Portal (Tutor) com wrapper explícito
  return withPortalSession(async ({ portalSession }) => {
    const messages = await prisma.portalMessage.findMany({
      where: {
        clinicId: portalSession.clinicId,
        ownerId: portalSession.ownerId,
        ...(requestIdParam ? { requestId: requestIdParam } : {})
      },
      orderBy: { createdAt: "asc" },
      take: 100
    });
    return NextResponse.json(messages);
  })(req);
}

// POST: Enviar mensagem
export const POST = withPortalSession(async ({ req, portalSession }) => {
  const { content, requestId } = await req.json();

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
  }

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
      message: content.trim().substring(0, 50) + (content.trim().length > 50 ? "..." : ""),
      type: "MESSAGE",
      ownerId: portalSession.ownerId,
      requestId: requestId || null,
      link: `/dashboard/appointments?ownerId=${portalSession.ownerId}`
    }
  });

  return NextResponse.json(message);
});
