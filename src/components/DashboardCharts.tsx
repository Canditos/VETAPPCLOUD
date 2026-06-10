"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { format, isAfter } from "date-fns";

const fmt = (v: number) =>
  v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type RevenuePoint = { date: string; value: number };
type AppointmentPoint = { date: string; value: number };

export function RevenueChart({
  data,
  loading,
}: {
  data?: RevenuePoint[];
  loading?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl">
      <CardHeader className="px-5 py-4 pb-2 flex flex-row justify-between items-center space-y-0">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Faturação
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => v}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v / 1000}k`}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [fmt(value), "Faturação"]}
                labelFormatter={(label) => label}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 700 }}
              />
              <Line
                type="monotone"
                dataKey="value"
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

export function AppointmentsChart({
  data,
  loading,
}: {
  data?: AppointmentPoint[];
  loading?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl">
      <CardHeader className="px-5 py-4 pb-2 flex flex-row justify-between items-center space-y-0">
        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Marcações
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value, "Marca\u00e7\u00f5es"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 700 }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  name,
  value,
  icon: Icon,
  color,
  bg,
  trend,
  href,
  loading,
}: {
  name: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: string;
  href?: string;
  loading?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl",
        href && "cursor-pointer hover:ring-blue-500/30 hover:shadow-md"
      )}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div
            className={cn(
              "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
              bg,
              color
            )}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
          {trend && (
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-0.5 border border-slate-100 dark:border-slate-700 rounded-full">
              {trend}
            </div>
          )}
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {name}
          </p>
          {loading ? (
            <Skeleton className="h-9 w-24 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── AlertBanner ───────────────────────────────────────────────────────────────
export function AlertBanner({ alert }: { alert: any }) {
  const router = useRouter();
  const isError = alert.level === "error";
  return (
    <div
      onClick={() => alert.href && router.push(alert.href)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:brightness-95 active:scale-[0.99]",
        isError
          ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30"
          : "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30"
      )}
    >
      <AlertTriangle size={15} className={isError ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} />
      <div className="flex-1 min-w-0">
        <span className={cn("font-bold text-sm", isError ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
          {alert.title}
        </span>
        {alert.desc && (
          <span className={cn("text-xs ml-2 truncate", isError ? "text-red-500" : "text-amber-500")}>
            — {alert.desc}
          </span>
        )}
      </div>
      <ChevronRight size={14} className={isError ? "text-red-400 shrink-0" : "text-amber-400 shrink-0"} />
    </div>
  );
}

// ── AppointmentRow ────────────────────────────────────────────────────────────
export function AppointmentRow({ appt, now }: { appt: any; now: Date }) {
  const router = useRouter();
  const start = new Date(appt.startTime);
  const isPast = isAfter(now, start);
  const isNext = !isPast && isAfter(new Date(now.getTime() + 60 * 60 * 1000), start);

  return (
    <div
      onClick={() => router.push(`/dashboard/consultations?patientId=${appt.patientId}&appointmentId=${appt.id}`)}
      className={cn(
        "group relative flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
        isNext
          ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-400"
          : isPast
          ? "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] opacity-60 hover:opacity-80"
          : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-md"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
        isNext ? "bg-blue-500" : isPast ? "bg-slate-200" : "bg-slate-100 group-hover:bg-blue-400 transition-colors")} />

      <div className="pl-3 flex flex-1 items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-200 group-hover:scale-105 shrink-0",
          isNext ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
          {appt.patient?.name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{appt.patient?.name}</p>
            {isNext && <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0 rounded-full">A seguir</span>}
            {isPast && <span className="text-slate-400 text-[9px] font-bold border border-slate-200 px-2 py-0 rounded-full">Passou</span>}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">{appt.patient?.owner?.name} · {appt.type ?? "Consulta"}</p>
        </div>

        <div className="text-right shrink-0">
          <p className={cn("text-lg font-bold tracking-tight", isNext ? "text-blue-600" : "text-slate-700 dark:text-slate-300")}>
            {format(start, "HH:mm")}
          </p>
        </div>
      </div>

      <ChevronRight size={16} className="ml-2 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
}
