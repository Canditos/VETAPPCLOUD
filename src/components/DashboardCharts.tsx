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
