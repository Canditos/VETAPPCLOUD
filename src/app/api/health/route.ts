import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: Record<string, unknown> = {
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'vet-app',
    version: process.env.APP_VERSION || 'local',
  };

  try {
    const prismaMod = await import('@/lib/prisma');
    const prismaClient = prismaMod.default;
    const start = Date.now();
    await prismaClient.$queryRaw`SELECT 1`;
    (status as any).db = { reachable: true, latencyMs: Date.now() - start };
  } catch (error) {
    (status as any).db = { reachable: false, error: (error as Error).message };
    (status as any).ok = false;
  }

  return NextResponse.json(status, { status: (status as any).ok ? 200 : 500 });
}
