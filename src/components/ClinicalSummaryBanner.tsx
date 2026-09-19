"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useClinicalSummary } from "@/hooks/useClinicalSummary";
import { useAISummary } from "@/hooks/useAISummary";
import { cn } from "@/lib/utils";

interface ClinicalSummaryBannerProps {
  patientId: string;
  fallbackGender?: string;
  className?: string;
}

export function ClinicalSummaryBanner({ patientId, fallbackGender, className }: ClinicalSummaryBannerProps) {
  const { data: summary, isLoading: isLocalLoading, error, isError } = useClinicalSummary(patientId);
  const [aiEnabled, setAiEnabled] = useState(false);
  const { data: aiSummary, isLoading: isAILoading } = useAISummary(patientId, aiEnabled);

  if (isLocalLoading) {
    return (
      <div className={cn("relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl shadow-blue-500/10 animate-pulse", className)}>
        <div className="h-24 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("relative overflow-hidden bg-red-500/10 border border-red-500/20 rounded-3xl p-8 shadow-sm", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Erro ao carregar o Resumo Clínico</h3>
        </div>
        <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-2 font-medium">
          {error instanceof Error ? error.message : "Ocorreu um erro desconhecido na API do resumo."}
        </p>
      </div>
    );
  }

  if (!summary) return null;

  const resolvedGender = summary.rawGender || fallbackGender || (summary.gender?.toLowerCase().startsWith("f") ? "F" : "M");
  const isFemale = resolvedGender === "F" || summary.gender?.toLowerCase().includes("fêm") || summary.gender?.toLowerCase().includes("fem");

  const hasAlerts = summary.safetyAlerts.length > 0 || summary.vaccines.expired.length > 0 || summary.deworming.overdue;
  const isLoadingAI = aiEnabled && isAILoading;

  // Background styling according to gender
  const bgGradient = isFemale
    ? hasAlerts
      ? "bg-gradient-to-r from-pink-600 via-rose-600 to-rose-700 shadow-rose-500/15"
      : "bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 shadow-rose-500/10"
    : hasAlerts
      ? "bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 shadow-blue-500/15"
      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-blue-500/10";

  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-8 shadow-xl text-white group", bgGradient, className)}>
      <div className={cn(
        "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:opacity-100 transition-all duration-700 opacity-60",
        isFemale ? "bg-pink-300/30" : "bg-white/20"
      )} />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-white">
              Resumo Clínico
            </h3>

            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
              aiEnabled ? "bg-purple-400/30 text-purple-100" : "bg-white/10 text-white/70"
            )}>
              {aiEnabled ? "IA Groq (Anonimizado)" : "Local — 100% privado"}
            </span>

            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className="text-[11px] font-medium text-white/80 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full transition-colors"
            >
              {aiEnabled ? "↩ Voltar Local" : "✨ Analisar com IA"}
            </button>
          </div>

          {isLoadingAI ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4" />
              <div className="h-4 bg-white/20 rounded w-1/2" />
            </div>
          ) : aiEnabled && aiSummary ? (
            <>
              <p className="text-white/90 text-base font-medium leading-relaxed">
                {aiSummary.summary}
              </p>
              {aiSummary.alerts.length > 0 && (
                <div className="space-y-1">
                  {aiSummary.alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 text-white text-sm font-semibold">
                      <AlertCircle size={14} /> {alert}
                    </div>
                  ))}
                </div>
              )}
              {aiSummary.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiSummary.recommendations.map((rec, i) => (
                    <span key={i} className="text-xs font-medium text-white bg-white/20 px-3 py-1 rounded-full">
                      💡 {rec}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/50">{aiSummary.disclaimer}</p>
            </>
          ) : (
            <>
              <p className="text-white/95 text-base font-medium leading-relaxed">
                <span className="font-bold">{summary.patientName}</span> é um {summary.species.toLowerCase()} {summary.gender.toLowerCase()} de {summary.breed}, {summary.ageText}.
                {summary.lastConsultation
                  ? ` Última consulta há ${summary.lastConsultation.daysAgo} dias com ${summary.lastConsultation.veterinarian}.`
                  : " Sem consultas registadas."}
              </p>

              {/* Safety Alerts */}
              {summary.safetyAlerts.length > 0 && (
                <div className="space-y-1">
                  {summary.safetyAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/95 text-sm font-semibold">
                      <AlertCircle size={14} /> {alert}
                    </div>
                  ))}
                </div>
              )}

              {/* Vaccine Status */}
              {summary.vaccines.expired.length > 0 && (
                <p className="text-amber-200 text-sm font-semibold">
                  ⚠️ {summary.vaccines.expired.length} vacina(s) expirada(s): {summary.vaccines.expired.join(", ")}
                </p>
              )}
              {summary.vaccines.upcoming.length > 0 && (
                <p className="text-white/80 text-sm">
                  📅 {summary.vaccines.upcoming.map(v => `${v.name} (em ${v.daysLeft}d)`).join(", ")}
                </p>
              )}

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {summary.recommendations.map((rec, i) => (
                    <span key={i} className="text-xs font-medium text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                      💡 {rec}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[11px] font-semibold text-white/75 mb-1">Peso</p>
            <p className="text-2xl font-bold text-white">{summary.weight ?? "—"}</p>
            {summary.weightTrend && (
              <p className={cn("text-xs font-medium mt-1", summary.weightTrend.startsWith("+") ? "text-white/80" : "text-emerald-200")}>
                {summary.weightTrend}
              </p>
            )}
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[11px] font-semibold text-white/75 mb-1">Idade</p>
            <p className="text-2xl font-bold text-white">{summary.ageText}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[11px] font-semibold text-white/75 mb-1">Vacinas</p>
            <p className="text-2xl font-bold text-white">{summary.vaccines.total}</p>
            {summary.vaccines.expired.length > 0 && (
              <p className="text-xs text-amber-200 mt-1">{summary.vaccines.expired.length} exp.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
