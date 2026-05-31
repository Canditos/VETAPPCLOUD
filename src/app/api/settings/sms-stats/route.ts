import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (ctx: any) => {
  const { clinicId, req } = ctx;
  const prisma = (await import("@/lib/prisma")).default;

  const daysParam = req.nextUrl?.searchParams?.get("days");
  const days = Math.min(Math.max(0, parseInt(daysParam) || 30), 365);

  const where = days > 0
    ? { clinicId, createdAt: { gte: new Date(Date.now() - days * 86400000) } }
    : { clinicId };
  const dateFilter = days > 0
    ? Prisma.sql`AND "createdAt" >= ${new Date(Date.now() - days * 86400000)}`
    : Prisma.empty;

  const [total, byStatus, byType, daily, weekly, monthly, recent] = await Promise.all([
    prisma.smsLog.count({ where }),
    prisma.smsLog.groupBy({ by: ["status"], where, _count: true }),
    prisma.smsLog.groupBy({ by: ["type"], where, _count: true }),
    prisma.$queryRaw<Array<{ date: string; total: bigint; sent: bigint; failed: bigint }>>(Prisma.sql`
      SELECT to_char("createdAt", 'YYYY-MM-DD') as date,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = ${clinicId}
        ${dateFilter}
      GROUP BY date ORDER BY date DESC LIMIT 90
    `),
    prisma.$queryRaw<Array<{ week: string; total: bigint; sent: bigint; failed: bigint }>>(Prisma.sql`
      SELECT to_char("createdAt", 'YYYY-WW') as week,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = ${clinicId}
        ${dateFilter}
      GROUP BY week ORDER BY week DESC LIMIT 12
    `),
    prisma.$queryRaw<Array<{ month: string; total: bigint; sent: bigint; failed: bigint }>>(Prisma.sql`
      SELECT to_char("createdAt", 'YYYY-MM') as month,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = ${clinicId}
        ${dateFilter}
      GROUP BY month ORDER BY month DESC LIMIT 12
    `),
    prisma.smsLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const parseDaily = <T extends { total: bigint | number; sent: bigint | number; failed: bigint | number }>(rows: T[]) =>
    (rows || []).map((row) => ({
      ...row,
      total: Number(row.total),
      sent: Number(row.sent),
      failed: Number(row.failed),
    }));
  const totalSent = byStatus.find((s: any) => s.status === "SENT")?._count || 0;
  const totalFailed = byStatus.find((s: any) => s.status === "FAILED")?._count || 0;

  const CUSTO_MENSAL = 5;
  const CUSTO_POR_SMS = 0.20;
  const custoSemPlano = (totalSent * CUSTO_POR_SMS);
  const economia = Math.max(0, custoSemPlano - CUSTO_MENSAL);

  return NextResponse.json({
    total,
    totalSent,
    totalFailed,
    successRate: total > 0 ? Math.round((totalSent / total) * 100) : 0,
    byStatus,
    byType,
    daily: parseDaily(daily),
    weekly: parseDaily(weekly),
    monthly: parseDaily(monthly),
    recent,
    last30Days: (parseDaily(daily)).reduce((acc: number, d: any) => acc + d.total, 0),
    custos: {
      mensal: CUSTO_MENSAL,
      porSms: CUSTO_POR_SMS,
      custoSemPlano: Math.round(custoSemPlano * 100) / 100,
      economia: Math.round(economia * 100) / 100,
      smsNoMes: totalSent,
    },
  });
});
