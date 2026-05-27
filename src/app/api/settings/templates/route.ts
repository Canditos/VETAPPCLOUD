import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withRole } from "@/lib/api-wrapper";
import crypto from "crypto";
import { z } from "zod";

type TemplateItem = {
  id: string;
  key: string;
  name: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

const templateBodySchema = z.object({
  id: z.string().min(1).optional(),
  key: z.string().min(1),
  name: z.string().min(1),
  message: z.string().min(1),
});

function parseTemplates(raw: unknown): TemplateItem[] {
  if (!raw) return [];

  const parsedRaw =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as unknown;
          } catch {
            return [] as unknown;
          }
        })()
      : raw;

  if (!Array.isArray(parsedRaw)) return [];

  return parsedRaw.filter((item): item is TemplateItem => {
    if (typeof item !== "object" || item === null) return false;
    const t = item as Record<string, unknown>;
    return (
      typeof t.id === "string" &&
      typeof t.key === "string" &&
      typeof t.name === "string" &&
      typeof t.message === "string" &&
      typeof t.createdAt === "string" &&
      typeof t.updatedAt === "string"
    );
  });
}

export const GET = withRole("sms", "LER", async ({ clinicId }) => {
  const prisma = (await import("@/lib/prisma")).default;
  let settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) {
    settings = await prisma.automationSettings.create({ data: { clinicId } });
  }
  const templates = parseTemplates((settings as unknown as { templates?: unknown }).templates);
  return NextResponse.json(templates);
});

export const POST = withRole("sms", "CRIAR_LER", async ({ req, clinicId }) => {
  const prisma = (await import("@/lib/prisma")).default;
  const parsedBody = templateBodySchema.safeParse(await req.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsedBody.error.flatten() }, { status: 400 });
  }
  const { id, key, name, message } = parsedBody.data;

  let settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) {
    settings = await prisma.automationSettings.create({ data: { clinicId } });
  }

  const templates = parseTemplates((settings as unknown as { templates?: unknown }).templates);
  const idx = templates.findIndex((t) => t.id === id);

  if (idx >= 0) {
    templates[idx] = { ...templates[idx], key, name, message, updatedAt: new Date().toISOString() };
  } else {
    templates.push({ id: id || crypto.randomUUID(), key, name, message, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  try { await prisma.$executeRawUnsafe(`ALTER TABLE "AutomationSettings" ADD COLUMN IF NOT EXISTS "templates" JSONB DEFAULT '[]'`); } catch {}

  await prisma.automationSettings.update({
    where: { clinicId },
    data: { templates: JSON.stringify(templates) } as unknown as { templates: string },
  });

  return NextResponse.json({ success: true, templates });
});

export const DELETE = withRole("sms", "CRIAR_LER", async ({ req, clinicId }) => {
  const prisma = (await import("@/lib/prisma")).default;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const settings = await prisma.automationSettings.findUnique({ where: { clinicId } });
  if (!settings) return NextResponse.json({ error: "No settings" }, { status: 404 });

  const templates = parseTemplates((settings as unknown as { templates?: unknown }).templates);
  const filtered = templates.filter((t) => t.id !== id);
  await prisma.automationSettings.update({
    where: { clinicId },
    data: { templates: JSON.stringify(filtered) } as unknown as { templates: string },
  });

  return NextResponse.json({ success: true });
});
