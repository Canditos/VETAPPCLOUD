import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedUrl = dbUrl.substring(0, 30) + "..." + dbUrl.substring(dbUrl.length - 10);
  
  try {
    const clinics = await prisma.clinic.findMany({ take: 10 });
    return NextResponse.json({ clinics, dbUrl: maskedUrl });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message, 
      dbUrl: maskedUrl,
      stack: error.stack 
    }, { status: 500 });
  }
}
