import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const POST = withAuth(async ({ req, clinicId }) => {
  try {
    const { content, ownerId, requestId } = await req.json();

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
});
