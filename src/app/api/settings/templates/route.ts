import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (ctx: any) => {
  const { clinicId } = ctx;
  const prisma = (await import("@/lib/prisma")).default;
  let settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) {
    settings = await prisma.automationSettings.create({ data: { clinicId } });
  }
  const templates = (settings as any).templates || [];
  return NextResponse.json(templates);
});

export const POST = withAuth(async (ctx: any) => {
  const { req, clinicId } = ctx;
  const prisma = (await import("@/lib/prisma")).default;
  const body = await req.json();
  const { id, key, name, message } = body;

  let settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) {
    settings = await prisma.automationSettings.create({ data: { clinicId } });
  }

  const templates: any[] = (settings as any).templates || [];
  const idx = templates.findIndex((t: any) => t.id === id);

  if (idx >= 0) {
    templates[idx] = { ...templates[idx], key, name, message, updatedAt: new Date().toISOString() };
  } else {
    templates.push({ id: id || crypto.randomUUID(), key, name, message, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  try { await prisma.$executeRawUnsafe(`ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "templates" JSONB DEFAULT '[]'`); } catch {}

  await prisma.automationSettings.update({
    where: { clinicId },
    data: { templates: JSON.stringify(templates) } as any,
  });

  return NextResponse.json({ success: true, templates });
});

export const DELETE = withAuth(async (ctx: any) => {
  const { req, clinicId } = ctx;
  const prisma = (await import("@/lib/prisma")).default;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) return NextResponse.json({ error: "No settings" }, { status: 404 });

  const templates: any[] = (settings as any).templates || [];
  const filtered = templates.filter((t: any) => t.id !== id);
  await prisma.automationSettings.update({
    where: { clinicId },
    data: { templates: JSON.stringify(filtered) } as any,
  });

  return NextResponse.json({ success: true });
});
