import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { withRole } from "@/lib/api-wrapper";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const GET = withRole("team", "LER", async ({ tenantPrisma }) => {
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

export const POST = withRole("team", "CRIAR_LER", async ({ req, tenantPrisma, clinicId }) => {
  try {
    const body = await req.json();
    const { name, email, role: newRole } = body;

    if (!name || !email || !newRole) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const tempPassword = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await tenantPrisma.user.create({
      data: {
        name,
        email,
        role: newRole,
        clinicId,
        passwordHash,
      }
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Email já registado" }, { status: 400 });
    }
    console.error("[TEAM_POST]", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Error";
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
