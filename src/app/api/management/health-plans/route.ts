import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const clinicId = (session.user as any).clinicId;

    const plans = await prisma.healthPlan.findMany({
      where: { clinicId },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[HEALTH_PLANS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinicId = (session.user as any).clinicId;
    const body = await request.json();
    const { name, description, price, billingCycle } = body;

    const plan = await prisma.healthPlan.create({
      data: {
        name,
        description,
        price,
        billingCycle,
        clinicId
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("[HEALTH_PLANS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
