import { NextResponse } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { content, ownerId, requestId } = await req.json();

  const message = await prisma.portalMessage.create({
    data: {
      content,
      senderId: session.user.id,
      senderType: "CLINIC",
      clinicId: session.user.clinicId,
      ownerId: ownerId,
      requestId: requestId || null
    }
  });

  return NextResponse.json(message);
}
