import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ clinicId }) => {
  try {
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
});

export const POST = withAuth(async ({ req, clinicId, session }) => {
  try {
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
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
});
