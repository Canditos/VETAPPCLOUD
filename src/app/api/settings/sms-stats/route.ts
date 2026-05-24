import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async (ctx: any) => {
  const { clinicId } = ctx;
  const prisma = (await import("@/lib/prisma")).default;

  const [total, byStatus, byType, daily, weekly, monthly, recent] = await Promise.all([
    prisma.smsLog.count({ where: { clinicId } }),
    prisma.smsLog.groupBy({ by: ["status"], where: { clinicId }, _count: true }),
    prisma.smsLog.groupBy({ by: ["type"], where: { clinicId }, _count: true }),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-MM-DD') as date,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
      GROUP BY date ORDER BY date DESC LIMIT 30
    `, clinicId),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-WW') as week,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
      GROUP BY week ORDER BY week DESC LIMIT 12
    `, clinicId),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-MM') as month,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, clinicId),
    prisma.smsLog.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const parseDaily = (rows: any[]) => (rows || []).map((r: any) => ({ ...r, total: Number(r.total), sent: Number(r.sent), failed: Number(r.failed) }));
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
