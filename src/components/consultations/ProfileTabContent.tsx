"use client";

import React from "react";
import { ClinicalProfile } from "./DiagnosticProfilesModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Sparkles, Check, ArrowRight, 
  Stethoscope, AlertCircle, FileText, Pill, Calendar, X
} from "lucide-react";
import { PremiumCard } from "@/components/PremiumCard";
import { toast } from "sonner";

interface ProfileTabContentProps {
  profile: ClinicalProfile;
  patientName?: string;
  patientSpecies?: string;
  onApplyToDiagnostics: (text: string) => void;
  onApplyToTreatment: (text: string) => void;
  onCloseTab?: () => void;
  onNavigateToClinical?: () => void;
}

export function ProfileTabContent({
  profile,
  patientName,
  patientSpecies,
  onApplyToDiagnostics,
  onApplyToTreatment,
}: ProfileTabContentProps) {

  const handleCopyDiagnostics = () => {
    const textToAppend = `\n[Perfil Clínico: ${profile.title}]\n• Estadiamento/Critérios: ${profile.stagingSystem}\n• Exames Recomendados:\n${profile.recommendedExams.map(e => `  - ${e}`).join("\n")}`;
    onApplyToDiagnostics(textToAppend);
    toast.success(`Protocolo de diagnóstico adicionado à Secção 5!`);
  };

  const handleCopyTreatment = () => {
    const textToAppend = `\n[Protocolo Terapêutico: ${profile.title}]\n${profile.treatmentProtocol.map(t => `• ${t}`).join("\n")}\n• Controlo/Follow-up: ${profile.followUp}`;
    onApplyToTreatment(textToAppend);
    toast.success(`Protocolo terapêutico adicionado à Secção 6!`);
  };

  const PROFILE_THEMES: Record<string, {
    bannerGrad: string;
    bannerBorder: string;
    iconBox: string;
    iconText: string;
    badge: string;
    quickBox: string;
    quickTitle: string;
    quickIcon: string;
    diagBtn: string;
  }> = {
    irc: {
      bannerGrad: "from-cyan-500/15 via-teal-500/5 to-transparent",
      bannerBorder: "border-cyan-500/20",
      iconBox: "bg-cyan-500/15 border-cyan-500/30",
      iconText: "text-cyan-600 dark:text-cyan-400",
      badge: "border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40",
      quickBox: "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200/60 dark:border-cyan-900/30",
      quickTitle: "text-cyan-800 dark:text-cyan-300",
      quickIcon: "text-cyan-600",
      diagBtn: "bg-cyan-600 hover:bg-cyan-700 text-white",
    },
    leishmaniose: {
      bannerGrad: "from-amber-500/15 via-orange-500/5 to-transparent",
      bannerBorder: "border-amber-500/20",
      iconBox: "bg-amber-500/15 border-amber-500/30",
      iconText: "text-amber-600 dark:text-amber-400",
      badge: "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40",
      quickBox: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30",
      quickTitle: "text-amber-800 dark:text-amber-300",
      quickIcon: "text-amber-600",
      diagBtn: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    diabetes: {
      bannerGrad: "from-purple-500/15 via-violet-500/5 to-transparent",
      bannerBorder: "border-purple-500/20",
      iconBox: "bg-purple-500/15 border-purple-500/30",
      iconText: "text-purple-600 dark:text-purple-400",
      badge: "border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40",
      quickBox: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/30",
      quickTitle: "text-purple-800 dark:text-purple-300",
      quickIcon: "text-purple-600",
      diagBtn: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    pancreatite: {
      bannerGrad: "from-rose-500/15 via-red-500/5 to-transparent",
      bannerBorder: "border-rose-500/20",
      iconBox: "bg-rose-500/15 border-rose-500/30",
      iconText: "text-rose-600 dark:text-rose-400",
      badge: "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40",
      quickBox: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/30",
      quickTitle: "text-rose-800 dark:text-rose-300",
      quickIcon: "text-rose-600",
      diagBtn: "bg-rose-600 hover:bg-rose-700 text-white",
    },
    cardiopatia: {
      bannerGrad: "from-red-500/15 via-rose-500/5 to-transparent",
      bannerBorder: "border-red-500/20",
      iconBox: "bg-red-500/15 border-red-500/30",
      iconText: "text-red-600 dark:text-red-400",
      badge: "border-red-500/30 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40",
      quickBox: "bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/30",
      quickTitle: "text-red-800 dark:text-red-300",
      quickIcon: "text-red-600",
      diagBtn: "bg-red-600 hover:bg-red-700 text-white",
    },
    dermatite_atopica: {
      bannerGrad: "from-orange-500/15 via-amber-500/5 to-transparent",
      bannerBorder: "border-orange-500/20",
      iconBox: "bg-orange-500/15 border-orange-500/30",
      iconText: "text-orange-600 dark:text-orange-400",
      badge: "border-orange-500/30 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40",
      quickBox: "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/30",
      quickTitle: "text-orange-800 dark:text-orange-300",
      quickIcon: "text-orange-600",
      diagBtn: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  };

  const theme = PROFILE_THEMES[profile.id] || PROFILE_THEMES.leishmaniose;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Profile Header Banner */}
      <PremiumCard padding="none">
        <div className={cn("p-6 bg-gradient-to-r border-b flex flex-col md:flex-row md:items-center justify-between gap-4", theme.bannerGrad, theme.bannerBorder)}>
          <div className="flex items-start gap-4">
            <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner", theme.iconBox, theme.iconText)}>
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {profile.title}
                </h2>
                <Badge variant="outline" className={cn("text-[11px] font-semibold", theme.badge)}>
                  {profile.category}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {profile.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Transfer Actions */}
          <div className={cn("flex flex-wrap items-center gap-3 p-4 rounded-2xl border", theme.quickBox)}>
            <div className={cn("flex items-center gap-2 font-bold text-xs uppercase tracking-wider shrink-0", theme.quickTitle)}>
              <Sparkles className={cn("w-4 h-4", theme.quickIcon)} /> Ações Rápidas:
            </div>
            <Button
              type="button"
              onClick={handleCopyDiagnostics}
              className={cn("h-9 px-3.5 rounded-xl text-xs font-bold shadow-sm gap-2 active:scale-95 transition-all", theme.diagBtn)}
            >
              <FileText className="w-4 h-4" /> Inserir em Diagnósticos (Secção 5)
            </Button>
            <Button
              type="button"
              onClick={handleCopyTreatment}
              className="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm gap-2 active:scale-95 transition-all"
            >
              <Pill className="w-4 h-4" /> Inserir no Tratamento (Secção 6)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Staging & Diagnostics */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Estadiamento e Exames Complementares</span>
              </div>

              {/* Staging box */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
                  Critérios de Classificação & Estadiamento
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {profile.stagingSystem}
                </p>
              </div>

              {/* Recommended Exams */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bateria de Exames Recomendados
                </span>
                <div className="space-y-1.5">
                  {profile.recommendedExams.map((exam, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="flex-1">{exam}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Treatment & Follow-up */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Protocolo Terapêutico & Acompanhamento</span>
              </div>

              {/* Protocol lines */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Linhas de Tratamento Recomendadas
                </span>
                <div className="space-y-2">
                  {profile.treatmentProtocol.map((line, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  <Calendar className="w-3.5 h-3.5" /> Plano de Reavaliação & Controlo
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {profile.followUp}
                </p>
              </div>

              {/* Client Advice */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5" /> Recomendações e Informação ao Tutor
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {profile.clientAdvice}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
