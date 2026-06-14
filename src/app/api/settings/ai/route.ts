import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ clinicId }) => {
  try {
    let settings = await prisma.automationSettings.findUnique({
      where: { clinicId }
    });

    if (!settings) {
      settings = await prisma.automationSettings.create({
        data: { clinicId }
      });
    }

    return NextResponse.json({
      aiApiKey: settings.aiApiKey || "",
      aiBaseUrl: settings.aiBaseUrl || "https://opencode.ai/zen/go/v1",
      aiModel: settings.aiModel || "deepseek-v4-flash",
    });
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withAuth(async ({ req, clinicId }) => {
  try {
    const body = await req.json();
    const { aiApiKey, aiBaseUrl, aiModel } = body;

    await prisma.automationSettings.upsert({
      where: { clinicId },
      update: {
        aiApiKey: aiApiKey || null,
        aiBaseUrl: aiBaseUrl || "https://opencode.ai/zen/go/v1",
        aiModel: aiModel || "deepseek-v4-flash",
      },
      create: {
        clinicId,
        aiApiKey: aiApiKey || null,
        aiBaseUrl: aiBaseUrl || "https://opencode.ai/zen/go/v1",
        aiModel: aiModel || "deepseek-v4-flash",
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
