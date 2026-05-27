"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PainCategory {
  label: string;
  hint?: string;
  options: string[];
}

interface PainAssessmentFormProps {
  species: string; // "Cão" | "Gato" | outros
  value: number;   // -1 = não avaliado; 0-10 = score normalizado
  onChange: (normalizedScore: number, rawScore: number, maxScore: number) => void;
}

// ─── Protocolo Glasgow CMPS-SF simplificado — CÃES ────────────────────────────
// Referência: Murrell et al. (2008) — Veterinary Anaesthesia and Analgesia
// 6 categorias × máx. 3 = 18 pontos

const CMPS_DOG: PainCategory[] = [
  {
    label: "Postura",
    hint: "Observe a posição espontânea do animal",
    options: ["Normal / relaxada", "Encolhido ou tenso", "Arqueado / rígido", "Prostrado / incapaz de se posicionar"],
  },
  {
    label: "Actividade",
    hint: "Avalie o movimento voluntário",
    options: ["Movimenta-se normalmente", "Inquieto / agitado", "Relutante em mover-se", "Recusa mover / imóvel"],
  },
  {
    label: "Vocalização",
    hint: "Avalie durante o repouso e ao toque",
    options: ["Silencioso", "Geme ocasionalmente", "Chora / uiva", "Vocalização contínua ou grito"],
  },
  {
    label: "Atenção à zona afectada",
    hint: "Observe comportamento espontâneo",
    options: ["Ignora completamente", "Olha para a zona", "Lambe / esfrega repetidamente", "Morde / mutila a zona"],
  },
  {
    label: "Resposta à palpação",
    hint: "Palpe suavemente a zona afectada",
    options: ["Sem reacção", "Olha / franze a testa", "Recua / retira o membro", "Agressivo / tenta morder"],
  },
  {
    label: "Estado mental",
    hint: "Avalie o comportamento geral",
    options: ["Alerta e interactivo", "Quieto mas responsivo", "Deprimido / apático", "Ansioso / expressão de medo"],
  },
];

// ─── Grimace Scale + comportamental — GATOS ───────────────────────────────────
// Referência: Steagall et al. (2020) — Journal of Feline Medicine and Surgery
// 5 categorias: 2 pontos cada = 10 pontos

const GRIMACE_CAT: PainCategory[] = [
  {
    label: "Posição das orelhas",
    hint: "Observe em repouso sem estimulação",
    options: ["Erectas e direccionadas para a frente", "Ligeiramente baixas ou rodadas", "Achatadas / coladas à cabeça"],
  },
  {
    label: "Contorno orbital",
    hint: "Avalie o grau de abertura dos olhos",
    options: ["Abertos normalmente", "Semicerrados (½ fechados)", "Cerrados / apertados ou piscando"],
  },
  {
    label: "Tensão malar e nasal",
    hint: "Observe a tensão dos músculos faciais",
    options: ["Relaxada", "Moderadamente tensa", "Muito tensa / contorcida"],
  },
  {
    label: "Postura corporal",
    hint: "Observe a posição espontânea",
    options: ["Normal / decúbito esternal relaxado", "Encolhido / cabeça baixa", "Arqueado / rígido / cabeça escondida"],
  },
  {
    label: "Resposta ao toque",
    hint: "Toque suavemente a zona suspeita",
    options: ["Normal / sem reacção", "Hesita / afasta-se", "Agressivo / grunhe / morde"],
  },
];

// ─── Mapa de severidade ───────────────────────────────────────────────────────

function getSeverity(normalizedScore: number): {
  label: string;
  color: string;
  badge: string;
} {
  if (normalizedScore < 0) return { label: "Não avaliado", color: "text-slate-400", badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  if (normalizedScore <= 2) return { label: "Sem dor / mínima", color: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
  if (normalizedScore <= 4) return { label: "Dor ligeira", color: "text-yellow-600 dark:text-yellow-400", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  if (normalizedScore <= 6) return { label: "Dor moderada", color: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
  if (normalizedScore <= 8) return { label: "Dor intensa", color: "text-rose-600 dark:text-rose-400", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
  return { label: "Dor máxima / emergência", color: "text-rose-700 dark:text-rose-400", badge: "bg-rose-600 text-white" };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PainAssessmentForm({ species, value, onChange }: PainAssessmentFormProps) {
  const isDog = species?.toLowerCase().includes("cão") || species?.toLowerCase().includes("cao") || species?.toLowerCase().includes("dog");
  const isCat = species?.toLowerCase().includes("gat") || species?.toLowerCase().includes("cat") || species?.toLowerCase().includes("felis");

  const protocol = isCat ? GRIMACE_CAT : CMPS_DOG;
  const maxScore = isCat ? protocol.length * 2 : protocol.length * 3;
  const protocolName = isCat ? "Grimace Scale (UFMG adaptada)" : "Glasgow CMPS-SF";

  // selections[i] = score for category i (-1 = not yet selected)
  const [selections, setSelections] = useState<number[]>(Array(protocol.length).fill(-1));

  // Recalculate and propagate whenever selections change
  useEffect(() => {
    const answered = selections.filter(s => s >= 0);
    if (answered.length === 0) {
      onChange(-1, -1, maxScore);
      return;
    }
    const rawScore = selections.reduce((acc, s) => acc + Math.max(0, s), 0);
    const normalized = Math.round((rawScore / maxScore) * 10);
    onChange(normalized, rawScore, maxScore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections]);

  const rawScore = selections.reduce((acc, s) => acc + Math.max(0, s), 0);
  const answeredCount = selections.filter(s => s >= 0).length;
  const severity = getSeverity(value);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Avaliação de Dor — {protocolName}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {isCat ? "Expressão facial + comportamental" : "Escala comportamental composta"} · {answeredCount}/{protocol.length} categorias avaliadas
          </p>
        </div>
        {answeredCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge className={cn("border-none text-[10px] font-bold px-3 py-1", severity.badge)}>
              {severity.label}
            </Badge>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {rawScore}/{maxScore}
            </span>
          </div>
        )}
      </div>

      {/* Warning if high pain detected */}
      {value >= 7 && (
        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-900/30">
          <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
            Dor intensa detectada — considere analgesia imediata antes de prosseguir.
          </p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-5">
        {protocol.map((cat, ci) => {
          const maxForCat = cat.options.length - 1;
          return (
            <div key={ci} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0",
                  selections[ci] < 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-400" :
                  selections[ci] === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                  selections[ci] === 1 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                  selections[ci] === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                  "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                )}>
                  {ci + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.label}</p>
                  {cat.hint && <p className="text-[10px] text-slate-400 font-medium">{cat.hint}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                {cat.options.map((opt, oi) => {
                  const isSelected = selections[ci] === oi;
                  const score = oi; // 0, 1, 2, 3
                  const colorSelected =
                    score === 0 ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" :
                    score === 1 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" :
                    score === 2 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" :
                    "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300";
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => {
                        const next = [...selections];
                        next[ci] = isSelected ? -1 : oi;
                        setSelections(next);
                      }}
                      className={cn(
                        "text-left text-xs font-semibold px-3 py-2.5 rounded-xl border-2 transition-all active:scale-[0.98]",
                        isSelected
                          ? colorSelected
                          : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      <span className={cn(
                        "inline-block w-4 h-4 rounded-md text-[9px] font-black mr-1.5 align-middle leading-4 text-center",
                        isSelected
                          ? score === 0 ? "bg-emerald-500 text-white" :
                            score === 1 ? "bg-yellow-500 text-white" :
                            score === 2 ? "bg-orange-500 text-white" :
                            "bg-rose-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      )}>
                        {score}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score bar */}
      {answeredCount > 0 && (
        <div className="pt-2 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>Sem dor</span><span>Ligeira</span><span>Moderada</span><span>Intensa</span><span>Máxima</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                value <= 2 ? "bg-emerald-500" :
                value <= 4 ? "bg-yellow-500" :
                value <= 6 ? "bg-orange-500" :
                value <= 8 ? "bg-rose-500" : "bg-rose-700"
              )}
              style={{ width: `${Math.max(4, (value / 10) * 100)}%` }}
            />
          </div>
          <p className={cn("text-xs font-bold text-right", severity.color)}>{severity.label}</p>
        </div>
      )}
    </div>
  );
}
