import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const mockBI = {
    revenueTrend: [
      { month: "Jan", revenue: 4200 },
      { month: "Fev", revenue: 5100 },
      { month: "Mar", revenue: 4800 },
      { month: "Abr", revenue: 6200 },
      { month: "Mai", revenue: 5900 },
      { month: "Jun", revenue: 7400 }
    ],
    speciesDistribution: [
      { name: "Cão", value: 164 },
      { name: "Gato", value: 92 },
      { name: "Exóticos", value: 18 }
    ],
    stats: {
      activeSubscriptions: 42,
      mrr: 1840.00,
      avgTicket: 68.40,
      patientRetention: 86,
    }
  };

  try {
    const revenue = await prisma.payment.aggregate({
      where: { clinicId: "c1-demo-clinic" },
      _sum: { amount: true }
    });

    if (revenue._sum.amount) {
       // Logic for real data... (simplified for brevity here)
    }

    return NextResponse.json(mockBI);
  } catch (error) {
    return NextResponse.json(mockBI);
  }
}
