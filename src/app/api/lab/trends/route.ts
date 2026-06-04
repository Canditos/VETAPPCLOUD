export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-wrapper";

export const GET = withAuth(async ({ req, tenantPrisma }: { req: NextRequest; tenantPrisma: any }) => {
  try {
    const patientId = req.nextUrl.searchParams.get("patientId");
    if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });

    const labs = await tenantPrisma.labResult.findMany({
      where: { patientId },
      orderBy: { createdAt: "asc" },
    });

    const byTest: Record<string, { date: string; results: any[] }[]> = {};

    for (const lab of labs) {
      const json = lab.dataJson as any;
      const testName = json?.testName || "Análises Clínicas";
      const results = json?.results || [];
      if (results.length === 0) continue;
      if (!byTest[testName]) byTest[testName] = [];
      byTest[testName].push({ date: lab.createdAt, results });
    }

    const chartData = Object.entries(byTest).map(([testName, entries]) => {
      const paramMap: Record<string, {
        code: string; name: string; unit: string;
        refLow: number; refHigh: number;
        values: { date: string; value: number }[];
      }> = {};

      for (const entry of entries) {
        for (const r of entry.results) {
          if (!paramMap[r.code]) {
            paramMap[r.code] = {
              code: r.code, name: r.name, unit: r.unit,
              refLow: r.refLow, refHigh: r.refHigh,
              values: [],
            };
          }
          paramMap[r.code].values.push({ date: entry.date, value: r.value });
        }
      }

      const parameters = Object.values(paramMap).map((p) => {
        const vals = p.values.map(v => v.value);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const margin = (max - min) * 0.15 || (p.refHigh - p.refLow) * 0.1 || 1;
        return {
          ...p,
          minDomain: Math.min(min, p.refLow ?? min) - margin,
          maxDomain: Math.max(max, p.refHigh ?? max) + margin,
        };
      });

      return { testName, parameters };
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("[LAB_TRENDS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
});
