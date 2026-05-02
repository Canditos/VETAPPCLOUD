import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || "c1-demo-clinic";

    let plans = await prisma.healthPlan.findMany({
      where: { clinicId },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    if (plans.length === 0) {
      // Mock plans for demo
      return NextResponse.json([
        {
          id: "mock-1",
          name: "Plano Preventivo Base",
          description: "Inclui vacinação anual e 2 consultas de rotina.",
          price: 15.00,
          billingCycle: "MONTHLY",
          _count: { subscriptions: 12 }
        },
        {
          id: "mock-2",
          name: "Plano Vitalidade Plus",
          description: "Vacinação completa, check-up anual, destartarização e 15% de desconto.",
          price: 35.00,
          billingCycle: "MONTHLY",
          _count: { subscriptions: 8 }
        },
        {
          id: "mock-3",
          name: "Plano Sénior",
          description: "Acompanhamento geriátrico especializado com análises trimestrais.",
          price: 45.00,
          billingCycle: "MONTHLY",
          _count: { subscriptions: 5 }
        }
      ]);
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching health plans:", error);
    return NextResponse.json({ error: "Erro ao carregar planos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, billingCycle, clinicId } = body;

    const plan = await prisma.healthPlan.create({
      data: {
        name,
        description,
        price,
        billingCycle,
        clinicId: clinicId || "c1-demo-clinic"
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error creating health plan:", error);
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
