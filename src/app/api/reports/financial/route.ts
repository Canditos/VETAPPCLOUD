import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const clinicId = (session?.user as any)?.clinicId || "c1-demo-clinic";

  // Mocked Financial Data for High-Fidelity Demo
  const financialData = {
    revenue: {
      total: 12540.50,
      growth: 12.5,
      monthly: [
        { month: "Jan", revenue: 8200, expenses: 4100 },
        { month: "Fev", revenue: 9100, expenses: 4500 },
        { month: "Mar", revenue: 11500, expenses: 5200 },
        { month: "Abr", revenue: 10800, expenses: 4800 },
        { month: "Mai", revenue: 12540, expenses: 5800 },
      ]
    },
    servicesBreakdown: [
      { name: "Consultas", value: 45, color: "#3b82f6" },
      { name: "Cirurgias", value: 25, color: "#8b5cf6" },
      { name: "Vacinas", value: 15, color: "#10b981" },
      { name: "Exames", value: 10, color: "#f59e0b" },
      { name: "Outros", value: 5, color: "#64748b" },
    ],
    inventoryStats: {
      stockValue: 8450.00,
      expiringValue: 320.50,
      margin: 32.5
    },
    topClients: [
      { name: "Marco Cândido", visits: 12, totalSpent: 1250.40 },
      { name: "Ana Martins", visits: 8, totalSpent: 840.20 },
      { name: "João Silva", visits: 5, totalSpent: 420.00 },
    ]
  };

  try {
    // In production, we would aggregate real invoices from Prisma or Jasmin
    // For now, return the high-fidelity mock
    return NextResponse.json(financialData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
