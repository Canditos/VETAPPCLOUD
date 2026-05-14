import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, ownerId, requestId } = await req.json();
    const clinicId = (session.user as any).clinicId;

    if (!content || !ownerId) {
      return new NextResponse("Conteúdo e OwnerId são obrigatórios", { status: 400 });
    }

    const message = await prisma.portalMessage.create({
      data: {
        content,
        senderId: clinicId,
        senderType: "CLINIC",
        clinicId,
        ownerId,
        requestId: requestId || null,
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_SEND]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
