import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const labResults = await prisma.labResult.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labResults);
  } catch (error) {
    console.error("Error fetching lab results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
