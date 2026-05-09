import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    const users = await prisma.user.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[TEAM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const body = await req.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Note: In a real app, we would send an invite email
    // For now, we'll create the user with a temporary password or just the record
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        clinicId,
        passwordHash: "TEMPORARY_INVITE", // This should be handled by an invite flow
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email já registado" }, { status: 400 });
    }
    console.error("[TEAM_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
