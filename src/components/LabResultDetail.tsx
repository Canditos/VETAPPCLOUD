"use client";

import { FlaskConical, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer, Dot,
} from "recharts";

interface LabItem {
  code: string; name: string; value: number; unit: string;
  refLow: number; refHigh: number; flag: "N" | "L" | "H";
}

export function LabResultDetail({ event }: { event: any }) {
  const data = event.data;
  const results: LabItem[] = data?.dataJson?.results ?? [];

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <FlaskConical size={24} className="mx-auto mb-2 opacity-40" />
        <p className="font-medium">A aguardar resultados...</p>
        <p className="text-[10px] mt-1">{data?.dataJson?.testName || "Análise solicitada"}</p>
      </div>
    );
  }

  const abnormal = results.filter(r => r.flag !== "N");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
          <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Parâmetros</p>
          <p className="text-lg font-black text-purple-700 dark:text-purple-300">{results.length}</p>
        </div>
        <div className={cn("p-3 rounded-xl border",
          abnormal.length > 0
            ? "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10"
            : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10"
        )}>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alterados</p>
          {abnormal.length > 0 ? (
            <p className="text-lg font-black text-rose-600">{abnormal.length}</p>
          ) : (
            <p className="text-sm font-black text-emerald-600">Normal</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60">
              <th className="text-left px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Parâmetro</th>
              <th className="text-right px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Resultado</th>
              <th className="text-center px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Ref.</th>
              <th className="text-center px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {results.map((r, i) => {
              const isAbnormal = r.flag === "L" || r.flag === "H";
              return (
                <tr key={i} className={cn(isAbnormal ? "bg-rose-50/30 dark:bg-rose-500/5" : "hover:bg-slate-50 dark:hover:bg-white/5")}>
                  <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {r.name}
                    <span className="text-[9px] text-slate-400 ml-1 font-mono">({r.code})</span>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-black tabular-nums",
                    isAbnormal ? "text-rose-600" : "text-slate-900 dark:text-white"
                  )}>
                    {r.value} <span className="text-[9px] font-medium text-slate-400">{r.unit}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[10px]">
                    {r.refLow} – {r.refHigh}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {r.flag === "N" ? (
                      <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black flex items-center justify-center mx-auto">N</span>
                    ) : r.flag === "H" ? (
                      <span className="inline-block w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black flex items-center justify-center mx-auto" title="Alto">H</span>
                    ) : (
                      <span className="inline-block w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[9px] font-black flex items-center justify-center mx-auto" title="Baixo">L</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data?.dataJson?.lab && (
        <p className="text-[9px] text-slate-400 font-medium">
          Equipamento: {data.dataJson.lab} • {format(new Date(event.date), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
        </p>
      )}
    </div>
  );
}

export function LabResultsChart({ patientId }: { patientId: string }) {
  const { data: trends, isLoading } = useQuery({
    queryKey: ["lab-trends", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/lab/trends?patientId=${patientId}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!patientId,
  });

  if (isLoading) return <div className="text-center text-slate-400 py-8 text-sm">A carregar gráficos...</div>;
  if (!trends || trends.length === 0) return (
    <div className="text-center text-slate-400 py-8 text-sm">
      <TrendingUp size={24} className="mx-auto mb-2 opacity-40" />
      <p className="font-medium">Sem dados suficientes para gráficos</p>
      <p className="text-[10px] mt-1">São precisos pelo menos 2 resultados para mostrar tendências</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {trends.map((group: any, gi: number) => (
        <div key={gi}>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">{group.testName}</p>
          <div className="space-y-4">
            {group.parameters.map((param: any, pi: number) => (
              <div key={pi} className="p-4 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{param.name} <span className="text-[10px] text-slate-400 font-mono">({param.code})</span></p>
                  <p className="text-[9px] text-slate-400 font-mono">{param.unit}</p>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={param.values} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        tickFormatter={(v) => format(new Date(v), "dd/MM")}
                      />
                      <YAxis
                        domain={[param.minDomain ?? "auto", param.maxDomain ?? "auto"]}
                        tick={{ fontSize: 9, fill: "#94a3b8" }}
                        tickFormatter={(v) => v.toFixed(1)}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                        labelFormatter={(v) => format(new Date(v), "dd MMM yyyy", { locale: pt })}
                        formatter={(value: number) => [value.toFixed(2), param.name]}
                      />
                      {param.refLow != null && param.refHigh != null && (
                        <ReferenceArea y1={param.refLow} y2={param.refHigh} fill="#22c55e" fillOpacity={0.08} />
                      )}
                      <Line
                        type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2}
                        dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                  <span>Ref: {param.refLow} – {param.refHigh} {param.unit}</span>
                  <span>{param.values.length} análises</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
