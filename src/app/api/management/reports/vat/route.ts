import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const mockVAT = {
    month,
    totalBase: 12450.00,
    totalVAT: 2863.50,
    byRate: [
      { rate: 23, base: 10200.00, vat: 2346.00 },
      { rate: 6, base: 2250.00, vat: 135.00 },
      { rate: 0, base: 0, vat: 0 }
    ],
    status: "ESTIMATED"
  };

  try {
    // Logic for real calculation...
    // Return mock for now as per demo requirements
    return NextResponse.json(mockVAT);
  } catch (error) {
    return NextResponse.json(mockVAT);
  }
}
