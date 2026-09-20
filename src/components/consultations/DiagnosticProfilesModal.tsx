"use client";

import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Sparkles, Plus, Check, ChevronRight, Activity, 
  Stethoscope, ShieldAlert, Heart, Flame, Bug, Dog, Cat, Layers, X,
  PowerOff, AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClinicalProfile {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  species: "DOG" | "CAT" | "BOTH";
  description: string;
  iconName: string;
  stagingSystem: string;
  recommendedExams: string[];
  treatmentProtocol: string[];
  followUp: string;
  clientAdvice: string;
}

export const CLINICAL_PROFILES_CATALOG: ClinicalProfile[] = [
  {
    id: "leishmaniose",
    title: "Leishmaniose Canina",
    shortTitle: "Leishmaniose",
    category: "Infecciosas / Parasitárias",
    species: "DOG",
    description: "Doença parasitária multissistémica por Leishmania infantum transmitida por flebótomos.",
    iconName: "Bug",
    stagingSystem: "Estadiamento LeishVet (Estádios I a IV baseado em clínica, serologia e UPC/função renal)",
    recommendedExams: [
      "Serologia Quantitativa (IFI ou ELISA)",
      "Hemograma Completo + Bioquímica (Ureia, Creatinina, Proteínas Totais, Albumina)",
      "Proteinograma Eletroforético (relação A/G, pico gama)",
      "Urina tipo II + Relação Proteína/Creatinina Urinária (UPC)",
      "Citologia / PCR de linfonodo ou medula se serologia inconclusiva"
    ],
    treatmentProtocol: [
      "Alopurinol (10 mg/kg BID PO por 6 a 12 meses)",
      "Miltefosina (2 mg/kg SID PO durante 28 dias) OU Antimoniato de Meglumina (100 mg/kg SID SC 28 dias)",
      "Domperidona (0.5 mg/kg SID 30 dias) como imunomodulador profilático",
      "Proteção tópica permanente contra flebótomos (coleira deltametrina ou pipeta permetrina)"
    ],
    followUp: "Controlo analítico (Hemograma, UPC, Perfil renal e Proteinograma) ao fim de 30 dias, 3 meses e depois semestral.",
    clientAdvice: "Doença crónica não curável bacteriologicamente; controlo clínico estrito e proteção contínua contra insetos vetores."
  },
  {
    id: "irc",
    title: "Insuficiência Renal Crónica (IRC)",
    shortTitle: "Insuficiência Renal",
    category: "Nefrologia / Urologia",
    species: "BOTH",
    description: "Perda progressiva e irreversível da função renal funcional com retenção de solutos urémicos.",
    iconName: "Activity",
    stagingSystem: "Classificação IRIS (Estádios 1 a 4 com base na Creatinina basal e SDMA, com sub-estadiamento de Proteinúria e Pressão Arterial)",
    recommendedExams: [
      "Painel Renal: Creatinina sérica, Ureia (BUN), SDMA, Fósforo sérico",
      "Eletrólitos: Potássio (K+), Sódio (Na+), Cloro, Cálcio total/iónico",
      "Urina Tipo II + Densidade Urinária Refratométrica + UPC",
      "Medição da Pressão Arterial Sistólica (Doppler)",
      "Ecografia Renal bilateral (corticomedular, quistos, hidronefrose)"
    ],
    treatmentProtocol: [
      "Dieta Renal terapêutica restrita em fósforo e proteína de alto valor biológico",
      "Hidratação parenteral ou fluidoterapia subcutânea (Hartmann/NaCl 0.9%) conforme necessidade",
      "Quelantes entéricos de fósforo (ex: Carbonato de Cálcio, Lantânio) se P sérico > 4.5 mg/dL",
      "Inibidor SGLT2 (Telmisartan 1 mg/kg SID) para controlo de proteinúria e hipertensão arterial",
      "Suplementação de Potássio se hipocaliemia; Probióticos entéricos azotémicos"
    ],
    followUp: "Reavaliação a cada 4 a 8 semanas em estádios 2-3; controlo mensal de PA e fósforo.",
    clientAdvice: "Garantir acesso constante a fontes de água limpa fresca e fontes circulantes. Transição gradual para a dieta renal."
  },
  {
    id: "diabetes",
    title: "Diabetes Mellitus",
    shortTitle: "Diabetes Mellitus",
    category: "Endocrinologia",
    species: "BOTH",
    description: "Deficiência absoluta ou relativa de insulina resultando em hiperglicemia persistente e glicosúria.",
    iconName: "Sparkles",
    stagingSystem: "Diabetes não complicada vs Cetoacidose Diabética (CAD)",
    recommendedExams: [
      "Curva Glicémica seriada (medição cada 2h durante 8-12h)",
      "Dosagem sérica de Frutosamina (controlo retrospetivo de 2-3 semanas)",
      "Urina II com tiras de corpos cetónicos e despiste de infeção urinária bacteriana",
      "Lipase específica (cPLI/fPLI) para despiste de pancreatite concomitante",
      "Perfil Hepático (ALT, FA, Bilirrubina) e Perfil Renal"
    ],
    treatmentProtocol: [
      "Insulinoterapia: Insulina Canina (Caninsulin) ou Glargina/ProZinc para felinos a cada 12h",
      "Alimentação regulada e sincronizada: refeição fornecida imediatamente antes ou com a dose de insulina",
      "Dieta com baixo índice glucémico e alta proteína (gatos) ou alta fibra solúvel/insolúvel (cães)",
      "Monitorização contínua domiciliária com sensor intersticial (ex: FreeStyle Libre)"
    ],
    followUp: "Primeira curva de controlo aos 7-10 dias após início ou alteração de dose; frutosamina mensal até estabilização.",
    clientAdvice: "Reconhecimento imediato de sinais de hipoglicemia (fraqueza, ataxia, tremores). Manter sempre mel ou xarope de glicose em casa."
  },
  {
    id: "pancreatite",
    title: "Pancreatite Aguda / Crónica",
    shortTitle: "Pancreatite",
    category: "Gastroenterologia",
    species: "BOTH",
    description: "Inflamação exócrina do pâncreas com ativação precoce de enzimas e dor abdominal aguda.",
    iconName: "Flame",
    stagingSystem: "Pancreatite Aguda Ligeira vs Severa Necrotizante / Pancreatite Crónica Felina (Tríade Felina)",
    recommendedExams: [
      "Lipase Pancreática Específica (Spec cPL / Spec fPL)",
      "Hemograma (Leucocitose com desvio à esquerda, trombocitopenia)",
      "Bioquímica: Enzimas hepáticas (ALT, FA), Bilirrubina, Amilase/Lipase, Eletrólitos",
      "Ecografia abdominal detalhada do parênquima pancreático e gordura mesentérica",
      "Tempo de Coagulação (PT/APTT) em casos graves com risco de CID"
    ],
    treatmentProtocol: [
      "Analgesia multimodal rigorosa (Buprenorfina, Fentanilo, Maropitant / Metadona)",
      "Fluidoterapia intravenosa vigorosa para manter perfusão microvascular pancreática",
      "Controlo de emese com Maropitant (1 mg/kg SC SID) e Ondansetrom (0.5 mg/kg IV TID)",
      "Nutrição enteral precoce (dieta ultrabaixa em gordura para cães)",
      "Protetores gástricos (Omeprazol IV/PO) se suspeita de ulceração"
    ],
    followUp: "Reavaliação clínica e ultrassonográfica a cada 24-48h na fase aguda até cessação de dor e apetite espontâneo.",
    clientAdvice: "Evitar rigorosamente alimentos ricos em gorduras ou sobras de comida humana."
  },
  {
    id: "dermatite_atopica",
    title: "Dermatite Atópica Canina / CAD",
    shortTitle: "Dermatite Atópica",
    category: "Dermatologia",
    species: "DOG",
    description: "Dermatopatia inflamatória e pruriginosa crónica com predisposição genética mediada por IgE.",
    iconName: "ShieldAlert",
    stagingSystem: "Critérios de Favrot + Escala CADESI-4 e Escala Visual Análoga de Prurido (pVAS)",
    recommendedExams: [
      "Citologia cutânea (fitas colantes e esfregaço) para despiste de Malassezia e piodermite secundária",
      "Raspagem cutânea para despiste de Demodex / Sarcoptes",
      "Tricografia e cultura fúngica (Dermatofitose)",
      "Dieta de eliminação com proteína hidrolisada durante 8 semanas para excluir alergia alimentar",
      "Testes serológicos para alérgenos ambientais específicos"
    ],
    treatmentProtocol: [
      "Controlo do prurido agudo: Oclacitinib (Apoquel 0.4–0.6 mg/kg BID 14d depois SID) ou Lokivetmab (Cytopoint)",
      "Terapêutica tópica: Champôs antissépticos (Clorexidina 3-4%) e hidratantes com ceramidas",
      "Restauro da barreira cutânea: Ácidos gordos essenciais Ómega 3 (EPA/DHA) em alta dosagem",
      "Tratamento imediato de sobrecrescimentos secundários (Cefalexina / Itraconazol conforme citologia)"
    ],
    followUp: "Avaliação a cada 3 a 4 semanas no início; depois consultas sazonais de ajuste de dose.",
    clientAdvice: "Trata-se de uma doença crónica sem cura definitiva, orientada ao controlo de crises e qualidade de vida."
  },
  {
    id: "cardiopatia",
    title: "Cardiopatia / Insuficiência Cardíaca Congestiva",
    shortTitle: "Cardiopatia / ICC",
    category: "Cardiologia",
    species: "BOTH",
    description: "Doença valvular degenerativa mitral (cães pequenos) ou Cardiomiopatia Hipertrófica (gatos).",
    iconName: "Heart",
    stagingSystem: "Consenso ACVIM (Estádios A, B1, B2 com remodelação, C com ICC ativa, D refratária)",
    recommendedExams: [
      "Radiografia torácica em 2 projeções (índice vertebral cardíaco VHS, padrão edema pulmonar)",
      "Ecocardiograma bidimensional com Doppler espectral e a cores",
      "Eletrocardiograma (ECG) para identificação de arritmias ventriculares ou supraventriculares",
      "Biomarcador NT-proBNP quantitativo e Troponina I",
      "Perfil renal e eletrólitos basais antes de iniciar diuréticos"
    ],
    treatmentProtocol: [
      "Estádio B2 / C: Pimobendan (0.25 mg/kg BID PO) — inodilatador",
      "Fase C (Edema pulmonar): Furosemida (1–2 mg/kg BID a QID conforme severidade)",
      "Inibidor da ECA (Benazepril ou Enalapril 0.25–0.5 mg/kg SID ou BID)",
      "Espironolactona (2 mg/kg SID PO) para bloqueio de aldosterona",
      "Gatos com CMH: Clopidogrel (18.75 mg SID) para profilaxia de tromboembolismo aórtico"
    ],
    followUp: "Controlo de Frequência Respiratória em Repouso (FRR) diária pelo tutor em casa (normal < 30 mpm).",
    clientAdvice: "Se a respiração em repouso ultrapassar 30 movimentos por minuto ou houver tosse persistente, procurar atendimento urgente."
  }
];

interface DiagnosticProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: ClinicalProfile) => void;
  onDeactivateProfile?: (profileId: string) => void;
  activeProfileIds: string[];
  patientSpecies?: string;
}

export function DiagnosticProfilesModal({
  isOpen,
  onClose,
  onSelectProfile,
  onDeactivateProfile,
  activeProfileIds,
  patientSpecies
}: DiagnosticProfilesModalProps) {
  const [search, setSearch] = useState("");
  const [profileToDeactivate, setProfileToDeactivate] = useState<ClinicalProfile | null>(null);

  const isFeline = (patientSpecies || "").toLowerCase().includes("gato") || (patientSpecies || "").toLowerCase().includes("fel");
  const isCanine = (patientSpecies || "").toLowerCase().includes("cão") || (patientSpecies || "").toLowerCase().includes("can");

  const filteredProfiles = CLINICAL_PROFILES_CATALOG.filter(profile => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = profile.title.toLowerCase().includes(q) ||
                    profile.category.toLowerCase().includes(q) ||
                    profile.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content — wide full screen presentation */}
        <DialogPrimitive.Content className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          z-50
          w-[95vw] max-w-5xl h-[88vh]
          rounded-3xl border border-slate-200 dark:border-white/10
          bg-white dark:bg-slate-900
          shadow-2xl shadow-black/40
          p-0 overflow-hidden flex flex-col
          outline-none
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
        ">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shrink-0 relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Perfis Clínicos de Diagnóstico</h3>
                  <p className="text-indigo-100 text-xs font-medium mt-0.5">
                    Selecione um protocolo clínico especializado para abrir uma aba de acompanhamento na consulta
                  </p>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="h-9 w-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 shrink-0"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Search bar */}
            <div className="mt-4 relative max-w-2xl">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por leishmaniose, insuficiência renal, diabetes, dermatite, pancreatite..."
                className="pl-9 pr-4 h-10 rounded-xl bg-white/15 text-white placeholder:text-indigo-200 border-indigo-400/30 focus-visible:ring-2 focus-visible:ring-white/40 text-xs font-medium"
              />
            </div>
          </div>

          {/* Profile list in responsive 2-column grid */}
          <div className="p-6 overflow-y-auto flex-1">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="text-sm font-semibold">Nenhum perfil encontrado com o termo "{search}".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProfiles.map((profile) => {
                  const isSelected = activeProfileIds.includes(profile.id);
                  const isSpeciesMatch = 
                    profile.species === "BOTH" ||
                    (isFeline && profile.species === "CAT") ||
                    (isCanine && profile.species === "DOG");

                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        onSelectProfile(profile);
                        onClose();
                      }}
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between gap-4",
                        isSelected
                          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ring-2 ring-indigo-500/20"
                          : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-300 hover:shadow-md"
                      )}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {profile.title}
                          </h4>
                          {isSelected && (
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Badge className="bg-emerald-600 text-white border-none text-[10px] font-bold gap-1">
                                <Check size={10} strokeWidth={3} /> Ativo no Paciente
                              </Badge>
                              {onDeactivateProfile && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProfileToDeactivate(profile);
                                  }}
                                  className="h-6 px-2 rounded-lg text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-[10px] font-bold gap-1 transition-all"
                                  title="Desativar perfil deste paciente"
                                >
                                  <PowerOff size={10} /> Desativar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 dark:border-slate-700 text-slate-500">
                            {profile.category}
                          </Badge>
                          {profile.species !== "BOTH" && (
                            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-none text-[10px] font-bold">
                              {profile.species === "DOG" ? "Caninos" : "Felinos"}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                          {profile.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            📋 {profile.recommendedExams.length} Exames recomendados
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            💊 Protocolo Terapêutico
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                        {isSelected ? (
                          <>
                            {onDeactivateProfile ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfileToDeactivate(profile);
                                }}
                                className="h-8 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 transition-all"
                              >
                                <PowerOff size={13} /> Desativar Perfil
                              </Button>
                            ) : <div />}
                            <Button
                              size="sm"
                              className="rounded-xl h-8 px-4 text-xs font-bold gap-1.5 shadow-sm bg-indigo-700 hover:bg-indigo-800 text-white ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProfile(profile);
                                onClose();
                              }}
                            >
                              Ver Tab
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl h-8 px-4 text-xs font-bold gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white group-hover:scale-105 ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProfile(profile);
                              onClose();
                            }}
                          >
                            <Plus size={13} /> Ativar Perfil
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>

      {/* Confirmation Dialog before deactivating */}
      <Dialog open={!!profileToDeactivate} onOpenChange={(open) => { if (!open) setProfileToDeactivate(null); }}>
        <DialogPortal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[95vw] max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Desativar Perfil Clínico?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tem a certeza que pretende desativar o perfil <strong className="text-slate-900 dark:text-white">{profileToDeactivate?.title}</strong> deste paciente?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>A aba deste perfil será removida da consulta. Poderá voltar a ativá-lo a qualquer momento através do catálogo.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileToDeactivate(null)}
                className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (profileToDeactivate) {
                    onDeactivateProfile?.(profileToDeactivate.id);
                    setProfileToDeactivate(null);
                  }
                }}
                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-rose-600/20"
              >
                <PowerOff size={14} /> Sim, Desativar Perfil
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </Dialog>
  );
}
