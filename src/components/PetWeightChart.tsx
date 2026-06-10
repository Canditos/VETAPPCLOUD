"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

type WeightEntry = { date: string; weight: number };

export function PetWeightChart({ entries, loading }: { entries?: WeightEntry[]; loading?: boolean }) {
  const data = entries ?? [];

  const latest = data[data.length - 1]?.weight;
  const previous = data.length >= 2 ? data[data.length - 2].weight : undefined;
  let delta: number | undefined;
  if (typeof latest === "number" && typeof previous === "number") delta = latest - previous;

  const status = typeof delta === "number" ? (delta > 0 ? "up" : delta < 0 ? "down" : "equal") : undefined;

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl overflow-hidden">
      <CardHeader className="px-5 py-4 pb-2 flex flex-row justify-between items-center space-y-0">
        <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} strokeWidth={2.5} className="text-blue-500" />
          Evolução do Peso
        </CardTitle>
        {typeof latest === "number" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Atual: {latest.toLocaleString("pt-PT")} kg
            </span>
            {status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold border-0 px-2 py-0.5",
                  status === "up" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  status === "down" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                  status === "equal" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {status === "up" ? <TrendingUp size={10} className="mr-1" /> : status === "down" ? <TrendingDown size={10} className="mr-1" /> : <Minus size={10} className="mr-1" />}
                {delta > 0 ? "+" : ""}{typeof delta === "number" ? delta.toLocaleString("pt-PT", { maximumFractionDigits: 2 }) : ""} kg
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 py-4">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : data.length <= 1 ? (
          <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-1">
            <Activity size={28} strokeWidth={1.5} />
            <p className="text-xs font-medium">Sem pesos registados</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => v}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v} kg`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString("pt-PT")} kg`, "Peso"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
