"use client";

import React, { useState } from "react";
import { 
  Sparkles, Activity, AlertTriangle, CheckCircle2, Copy, Check, 
  RotateCw, ShieldAlert, FileText, ChevronRight, Stethoscope, Beaker,
  TrendingUp, TrendingDown, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LabParamItem {
  name: string;
  value: number;
  unit: string;
  ref: string;
  status: "HIGH" | "LOW" | "NORMAL";
  clinicalMeaning: string;
}

interface AIAnalysisData {
  severity: "NORMAL" | "ATTENTION" | "ALERT" | "CRITICAL";
  summary: string;
  abnormalParameters: LabParamItem[];
  differentialDiagnoses: string[];
  recommendations: string[];
  suggestedFollowUp?: string;
  source?: string;
  model?: string;
  analyzedExamsCount: number;
  totalParametersCount: number;
  analyzedAt: string;
}

interface LabAIAnalysisCardProps {
  patientId: string;
  patient?: {
    name?: string;
    species?: string;
    breed?: string | null;
    gender?: string | null;
  } | null;
  labResults: any[];
}

export function LabAIAnalysisCard({
  patientId,
  patient,
  labResults = [],
}: LabAIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasLabResults = Array.isArray(labResults) && labResults.length > 0;

  const handleRunAnalysis = async () => {
    if (!patientId || !hasLabResults) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/lab-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, labResults }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao gerar análise com IA");
      }

      const data: AIAnalysisData = await res.json();
      setAnalysis(data);
      toast.success("Análise clínica com IA concluída com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Não foi possível analisar os exames com IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!analysis) return;

    let text = `RELATÓRIO DE ANÁLISE CLÍNICA LABORATORIAL (IA)\n`;
    text += `Paciente: ${patient?.name || "Animal"} (${patient?.species || "Espécie não informada"})\n`;
    text += `Gravidade Avaliada: ${analysis.severity}\n`;
    text += `\nRESUMO CLÍNICO:\n${analysis.summary}\n`;

    if (analysis.abnormalParameters.length > 0) {
      text += `\nPARÂMETROS ALTERADOS:\n`;
      analysis.abnormalParameters.forEach((p) => {
        text += `• ${p.name}: ${p.value} ${p.unit} (Ref: ${p.ref}) [${p.status === "HIGH" ? "ELEVADO" : "DIMINUÍDO"}]\n  → ${p.clinicalMeaning}\n`;
      });
    }

    if (analysis.differentialDiagnoses.length > 0) {
      text += `\nHIPÓTESES DE DIAGNÓSTICO DIFERENCIAL:\n`;
      analysis.differentialDiagnoses.forEach((d) => {
        text += `• ${d}\n`;
      });
    }

    if (analysis.recommendations.length > 0) {
      text += `\nRECOMENDAÇÕES CLÍNICAS & CONDUTA:\n`;
      analysis.recommendations.forEach((r) => {
        text += `• ${r}\n`;
      });
    }

    if (analysis.suggestedFollowUp) {
      text += `\nSEGUIMENTO / FOLLOW-UP:\n${analysis.suggestedFollowUp}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Relatório de análises copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev: AIAnalysisData["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <Badge className="bg-rose-600 text-white font-black text-xs px-3 py-1 gap-1.5 shadow-sm shadow-rose-500/20 border-none">
            <ShieldAlert size={14} /> Alerta Crítico / Múltiplos Desvios
          </Badge>
        );
      case "ALERT":
        return (
          <Badge className="bg-orange-500 text-white font-bold text-xs px-3 py-1 gap-1.5 shadow-sm border-none">
            <AlertTriangle size={14} /> Alerta Clínico / Alterações
          </Badge>
        );
      case "ATTENTION":
        return (
          <Badge className="bg-amber-500 text-white font-bold text-xs px-3 py-1 gap-1.5 shadow-sm border-none">
            <Info size={14} /> Atenção / Desvio Ligeiro
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 gap-1.5 shadow-sm border-none">
            <CheckCircle2 size={14} /> Parâmetros Dentro dos Limites Normais
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-md shadow-slate-200/30 dark:shadow-none overflow-hidden transition-all">
      {/* ── Top Banner ── */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-b border-slate-200/80 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Interpretação Clínica com IA (Análises &amp; Resultados)
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40">
                Patologia Clínica Veterinária
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Correlação cruzada de hemograma e bioquímica com deteção de desvios e hipóteses de diagnóstico diferencial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {analysis && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copiado!" : "Copiar Relatório"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={isLoading || !hasLabResults}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20 gap-2 active:scale-95 transition-all"
          >
            {isLoading ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                A analisar...
              </>
            ) : analysis ? (
              <>
                <RotateCw size={14} />
                Regenerar Análise
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analisar Análises com IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5 md:p-6 space-y-6">
        {!hasLabResults ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Beaker size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Ainda não existem resultados laboratoriais registados
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Quando importar relatórios HL7 ou requisitar um hemograma/bioquímica, a IA analisará automaticamente os parâmetros medidos.
            </p>
          </div>
        ) : isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
              <Sparkles size={20} className="absolute inset-0 m-auto text-purple-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                A processar interpretação hematológica e bioquímica com IA...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                A correlacionar {labResults.length} exame(s) com a espécie ({patient?.species || "animal"}), idade e intervalos de referência.
              </p>
            </div>
          </div>
        ) : !analysis ? (
          /* Initial callout state */
          <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                  Pronto para análise laboratorial com IA
                </h4>
              </div>
              <p className="text-xs text-purple-800/80 dark:text-purple-300/80">
                Clique no botão acima para sintetizar os {labResults.length} exame(s) registados, identificar padrões de desvio e receber sugestões de diagnóstico diferencial.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleRunAnalysis}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0 gap-1.5 shadow-sm"
            >
              <Sparkles size={14} /> Começar Análise
            </Button>
          </div>
        ) : (
          /* Analysis Results View */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
            {/* Status & Summary Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avaliação Geral:</span>
                {getSeverityBadge(analysis.severity)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {analysis.totalParametersCount} parâmetros avaliados · {analysis.analyzedExamsCount} exame(s)
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <FileText size={15} className="text-purple-600 dark:text-purple-400" />
                <span>Síntese Laboratorial &amp; Interpretação</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>

            {/* Abnormal Parameters Grid */}
            {analysis.abnormalParameters.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  <AlertTriangle size={15} />
                  <span>Parâmetros Fora do Intervalo de Referência ({analysis.abnormalParameters.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {analysis.abnormalParameters.map((p, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all space-y-2",
                        p.status === "HIGH"
                          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/30"
                          : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] font-black border-none gap-1",
                            p.status === "HIGH"
                              ? "bg-rose-600 text-white"
                              : "bg-amber-600 text-white"
                          )}
                        >
                          {p.status === "HIGH" ? (
                            <>
                              <TrendingUp size={12} strokeWidth={2.5} /> ELEVADO
                            </>
                          ) : (
                            <>
                              <TrendingDown size={12} strokeWidth={2.5} /> DIMINUÍDO
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-baseline gap-2 text-xs">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {p.value} {p.unit}
                        </span>
                        <span className="text-slate-500 font-medium">
                          (Ref: {p.ref} {p.unit})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal pt-1 border-t border-slate-200/50 dark:border-white/5">
                        {p.clinicalMeaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Differential Diagnoses & Recommendations (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Differential Diagnoses */}
              <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  <Stethoscope size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Hipóteses de Diagnóstico Diferencial</span>
                </div>
                <div className="space-y-2">
                  {analysis.differentialDiagnoses.map((diff, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{diff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-5 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
                  <CheckCircle2 size={15} className="text-teal-600 dark:text-teal-400" />
                  <span>Recomendações Clínicas &amp; Próximos Passos</span>
                </div>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="w-5 h-5 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        ✓
                      </span>
                      <span className="flex-1 leading-relaxed">{rec}</span>
                    </div>
                  ))}
                  {analysis.suggestedFollowUp && (
                    <div className="pt-2 mt-2 border-t border-teal-200/50 dark:border-teal-900/30 text-[11px] text-teal-800 dark:text-teal-300 font-semibold flex items-center gap-1.5">
                      <Activity size={13} />
                      <span>{analysis.suggestedFollowUp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Apoio à decisão médica veterinária. A interpretação final cabe ao médico veterinário responsável.</span>
              <span className="font-mono text-[10px]">
                {analysis.source === "LLM" ? `IA: ${analysis.model || "Llama 3.1"}` : "Motor Clínico Patológico"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
