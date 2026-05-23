import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ tenantPrisma }) => {
  try {
    const users = await tenantPrisma.user.findMany({
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
    const errorMessage = error instanceof Error ? error.message : "Internal Error";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

export const POST = withAuth(async ({ req, tenantPrisma, clinicId, session }) => {
  try {
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await tenantPrisma.user.create({
      data: {
        name,
        email,
        role,
        clinicId,
        passwordHash,
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email já registado" }, { status: 400 });
    }
    console.error("[TEAM_POST]", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Error";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
