"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { Activity, Beaker, ChevronRight, AlertTriangle } from "lucide-react";

interface LabParameter {
  name: string;
  value: number;
  unit: string;
  refMin?: number;
  refMax?: number;
  isAbnormal?: boolean;
}

interface LabResult {
  id: string;
  createdAt: string;
  source: string;
  dataJson: {
    parameters: LabParameter[];
  };
}

interface Props {
  results: LabResult[];
}

export function LabChartsViewer({ results }: Props) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null);

  // Extrair todos os parâmetros únicos que já foram medidos neste animal
  const uniqueParams = useMemo(() => {
    const params = new Set<string>();
    results.forEach(res => {
      if (res.dataJson && Array.isArray(res.dataJson.parameters)) {
        res.dataJson.parameters.forEach(p => params.add(p.name));
      }
    });
    const sorted = Array.from(params).sort();
    if (sorted.length > 0 && !selectedParam) {
      setSelectedParam(sorted[0]);
    }
    return sorted;
  }, [results]);

  // Preparar os dados para o gráfico do parâmetro selecionado
  const chartData = useMemo(() => {
    if (!selectedParam) return { data: [], unit: "", refMin: undefined, refMax: undefined };
    
    let unit = "";
    let refMin: number | undefined;
    let refMax: number | undefined;

    const data = results.map(res => {
      const paramData = res.dataJson?.parameters?.find((p: any) => p.name === selectedParam);
      
      if (paramData) {
        if (paramData.unit) unit = paramData.unit;
        if (paramData.refMin !== undefined) refMin = paramData.refMin;
        if (paramData.refMax !== undefined) refMax = paramData.refMax;
      }

      return {
        date: format(new Date(res.createdAt), "dd MMM yy", { locale: ptBR }),
        fullDate: format(new Date(res.createdAt), "dd/MM/yyyy HH:mm"),
        value: paramData ? paramData.value : null,
        isAbnormal: paramData ? paramData.isAbnormal : false,
        source: res.source
      };
    }).filter(d => d.value !== null).reverse(); // Inverter para ordem cronológica ascendente

    return { data, unit, refMin, refMax };
  }, [results, selectedParam]);

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        <Beaker className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Sem análises registadas</h3>
        <p className="mt-2 text-sm">Este paciente ainda não tem resultados de laboratório associados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      
      {/* Menu Lateral - Lista de Parâmetros */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-indigo-500" /> Parâmetros ({uniqueParams.length})
        </h3>
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
          {uniqueParams.map(param => {
            // Verificar o estado mais recente deste parâmetro
            const latestRes = results.find(r => r.dataJson?.parameters?.some((p: any) => p.name === param));
            const latestParam = latestRes?.dataJson?.parameters?.find((p: any) => p.name === param);
            const isAlert = latestParam?.isAbnormal;

            return (
              <button
                key={param}
                onClick={() => setSelectedParam(param)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors
                  ${selectedParam === param 
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium' 
                    : 'bg-white border border-transparent hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{param}</span>
                  {isAlert && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedParam === param ? 'text-indigo-500' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="flex-grow min-h-[400px]">
        {selectedParam && (
          <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {selectedParam}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Valores de referência: {chartData.refMin !== undefined ? chartData.refMin : '?'} - {chartData.refMax !== undefined ? chartData.refMax : '?'} {chartData.unit}
                </p>
              </div>
            </div>

            <div className="flex-grow" style={{ minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                    domain={[
                      (dataMin: number) => {
                        const baseMin = chartData.refMin !== undefined ? Math.min(dataMin, chartData.refMin) : dataMin;
                        return Math.max(0, baseMin - (baseMin * 0.2));
                      },
                      (dataMax: number) => {
                        const baseMax = chartData.refMax !== undefined ? Math.max(dataMax, chartData.refMax) : dataMax;
                        return baseMax + (baseMax * 0.2);
                      }
                    ]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  
                  {/* Área de Segurança (Referência) Verde Clarinho */}
                  {chartData.refMin !== undefined && chartData.refMax !== undefined && (
                    <ReferenceArea 
                      y1={chartData.refMin} 
                      y2={chartData.refMax} 
                      fill="#10b981" 
                      fillOpacity={0.1} 
                    />
                  )}

                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={chartData.unit ? `Valor (${chartData.unit})` : "Valor"}
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
