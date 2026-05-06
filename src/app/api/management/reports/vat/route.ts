import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const mockVAT = {
    month,
    base6: 2250.00,
    totalVat6: 135.00,
    base13: 450.00,
    totalVat13: 58.50,
    base23: 10200.00,
    totalVat23: 2346.00,
    totalGross: 15439.50,
    status: "ESTIMATED"
  };

  try {
    return NextResponse.json(mockVAT);
  } catch (error) {
    return NextResponse.json(mockVAT);
  }
}
