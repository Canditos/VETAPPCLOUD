import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-wrapper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = withRole("sms", "LER", async ({ clinicId }) => {
  try {
    const logs = await prisma.smsLog.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[SMS_LOGS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
