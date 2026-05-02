export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/team - List clinic staff
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  const staff = await prisma.user.findMany({
    where: { clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(staff);
}

// POST /api/team - Add new staff member
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Only ADMINs can add staff
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  const { name, email, password, role } = body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        clinicId,
        name,
        email,
        passwordHash,
        role,
      },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    return NextResponse.json({ error: "User creation failed" }, { status: 500 });
  }
}
