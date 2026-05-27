import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withRole } from "@/lib/api-wrapper";
import { z } from "zod";

type AggregateRow = {
  date?: string;
  week?: string;
  month?: string;
  total: string | number;
  sent: string | number;
  failed: string | number;
};

const querySchema = z.object({
  days: z.coerce.number().int().min(0).max(365).default(30),
});

export const GET = withRole("sms", "LER", async ({ clinicId, req }) => {
  const prisma = (await import("@/lib/prisma")).default;

  const parsedQuery = querySchema.safeParse({
    days: req.nextUrl?.searchParams?.get("days") ?? 30,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query", details: parsedQuery.error.flatten() }, { status: 400 });
  }
  const { days } = parsedQuery.data;

  const where = days > 0
    ? { clinicId, createdAt: { gte: new Date(Date.now() - days * 86400000) } }
    : { clinicId };

  const [total, byStatus, byType, daily, weekly, monthly, recent] = await Promise.all([
    prisma.smsLog.count({ where }),
    prisma.smsLog.groupBy({ by: ["status"], where, _count: true }),
    prisma.smsLog.groupBy({ by: ["type"], where, _count: true }),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-MM-DD') as date,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
        ${days > 0 ? `AND "createdAt" >= NOW() - make_interval(days => $2::int)` : ""}
      GROUP BY date ORDER BY date DESC LIMIT 90
    `, ...[clinicId, ...(days > 0 ? [days] : [])]),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-WW') as week,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
        ${days > 0 ? `AND "createdAt" >= NOW() - make_interval(days => $2::int)` : ""}
      GROUP BY week ORDER BY week DESC LIMIT 12
    `, ...[clinicId, ...(days > 0 ? [days] : [])]),
    prisma.$queryRawUnsafe(`
      SELECT to_char("createdAt", 'YYYY-MM') as month,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'SENT') as sent,
             COUNT(*) FILTER (WHERE status = 'FAILED') as failed
      FROM "SmsLog" WHERE "clinicId" = $1
        ${days > 0 ? `AND "createdAt" >= NOW() - make_interval(days => $2::int)` : ""}
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, ...[clinicId, ...(days > 0 ? [days] : [])]),
    prisma.smsLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const parseAggregateRows = (rows: AggregateRow[]) =>
    rows.map((r) => ({
      ...r,
      total: Number(r.total),
      sent: Number(r.sent),
      failed: Number(r.failed),
    }));

  const typedByStatus = byStatus as Array<{ status: string; _count: number }>;
  const totalSent = typedByStatus.find((s) => s.status === "SENT")?._count || 0;
  const totalFailed = typedByStatus.find((s) => s.status === "FAILED")?._count || 0;

  const parsedDaily = parseAggregateRows(daily as AggregateRow[]);
  const parsedWeekly = parseAggregateRows(weekly as AggregateRow[]);
  const parsedMonthly = parseAggregateRows(monthly as AggregateRow[]);

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
    daily: parsedDaily,
    weekly: parsedWeekly,
    monthly: parsedMonthly,
    recent,
    last30Days: parsedDaily.reduce((acc, d) => acc + d.total, 0),
    custos: {
      mensal: CUSTO_MENSAL,
      porSms: CUSTO_POR_SMS,
      custoSemPlano: Math.round(custoSemPlano * 100) / 100,
      economia: Math.round(economia * 100) / 100,
      smsNoMes: totalSent,
    },
  });
});
