"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bug,
  Dog,
  Cat,
  Search,
  Pill,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Info,
  Weight,
  Syringe,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Target = "INTERNAL" | "EXTERNAL" | "BOTH";

interface GuideRef {
  key: string;
  name: string;
  activeIngredient: string;
  target: Target;
  species: string[];
  weightMinKg: number;
  weightMaxKg: number;
  minAgeWeeks?: number;
  route: string;
  doseText: string;
  protectionMonths: number;
  frequencyLabel: string;
  warnings?: string;
  weightMatch: boolean;
  ageWarning: boolean;
}

interface GuideStock {
  productId: string;
  productName: string;
  price: number | null;
  pricePerMonth: number | null;
  inStock: boolean;
  stockQuantity: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

interface GuideResult {
  ref: GuideRef;
  stock: GuideStock | null;
}

interface GuideResponse {
  query: { species: string | null; weightKg: number | null; ageMonths: number | null };
  results: GuideResult[];
  disclaimer: string;
}

interface DewormingGuideProps {
  patientId?: string;
  compact?: boolean;
}

const TARGET_LABEL: Record<Target, string> = {
  INTERNAL: "Interna",
  EXTERNAL: "Externa",
  BOTH: "Interna + Externa",
};

const TARGET_CLASS: Record<Target, string> = {
  INTERNAL: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  EXTERNAL: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  BOTH: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
};

const eur = (v: number) => `${v.toFixed(2).replace(".", ",")} €`;

function PatientPicker({ onPick }: { onPick: (p: { id: string }) => void }) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["guide-patient-search", term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(term)}&limit=8`);
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const patients: Array<{ id: string; name: string; species: string; owner?: { name: string } }> =
    data?.data ?? [];

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <Input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Escolher paciente (nome / chip / tutor)…"
        className="h-12 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 font-medium"
      />
      {open && patients.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden max-h-72 overflow-y-auto">
          {patients.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onPick({ id: p.id });
                setTerm("");
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {p.species}
                  {p.owner?.name ? ` · ${p.owner.name}` : ""}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                Usar
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DewormingGuide({ patientId, compact = false }: DewormingGuideProps) {
  const [species, setSpecies] = useState<"Cão" | "Gato" | "">("");
  const [weight, setWeight] = useState("");
  // undefined = usa o paciente da prop; null = nenhum (modo manual); string = escolhido.
  const [manualPatient, setManualPatient] = useState<string | null | undefined>(undefined);
  const activePatient = manualPatient === undefined ? patientId : manualPatient ?? undefined;
  const [target, setTarget] = useState<"all" | "INTERNAL" | "EXTERNAL">("all");
  const [onlyStock, setOnlyStock] = useState(false);

  const weightNum = weight.trim() === "" ? null : Number(weight.replace(",", "."));
  const hasQuery = !!activePatient || (!!species && weightNum != null && !Number.isNaN(weightNum));

  const { data, isFetching } = useQuery<GuideResponse>({
    queryKey: ["deworming-guide", activePatient, species, weightNum],
    enabled: hasQuery,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activePatient) params.set("patientId", activePatient);
      else {
        params.set("species", species);
        if (weightNum != null && !Number.isNaN(weightNum)) params.set("weight", String(weightNum));
      }
      const res = await fetch(`/api/clinical/deworming-guide?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar o guia de desparasitação");
      return res.json();
    },
  });

  const results = useMemo(() => {
    let r = data?.results ?? [];
    if (target !== "all") r = r.filter((x) => x.ref.target === target || x.ref.target === "BOTH");
    if (onlyStock) r = r.filter((x) => x.stock?.inStock);
    return r;
  }, [data, target, onlyStock]);

  const ctxLabel = data?.query?.species
    ? `${data.query.species}${data.query.weightKg != null ? ` · ${data.query.weightKg} kg` : ""}`
    : null;

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
      {/* Control bar */}
      <Card className="border-none shadow-lg rounded-3xl p-5 bg-white dark:bg-slate-900/60 ring-1 ring-slate-200/60 dark:ring-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Espécie
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Cão", "Gato"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={species === s ? "default" : "outline"}
                  onClick={() => {
                    setSpecies(s);
                    setManualPatient(null);
                  }}
                  className={cn(
                    "h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest gap-2 transition-all",
                    species === s
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                  )}
                >
                  {s === "Cão" ? <Dog size={16} /> : <Cat size={16} />}
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Weight size={11} /> Peso (kg)
            </label>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setManualPatient(null);
              }}
              placeholder="Ex: 12,5"
              className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Ou escolher paciente
            </label>
            <PatientPicker
              onPick={(p) => {
                setManualPatient(p.id);
                setSpecies("");
                setWeight("");
              }}
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap gap-2">
            {(["all", "INTERNAL", "EXTERNAL"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={cn(
                  "h-9 px-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                  target === t
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-white/5 text-slate-400"
                )}
              >
                {t === "all" ? "Todas" : t === "INTERNAL" ? "Interna" : "Externa"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOnlyStock((v) => !v)}
              className={cn(
                "h-9 px-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                onlyStock
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-white/5 text-slate-400"
              )}
            >
              Só com stock
            </button>
          </div>
        </div>

        {ctxLabel && (
          <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <Info size={13} className="text-blue-500" />
            A mostrar opções para <span className="text-slate-900 dark:text-white">{ctxLabel}</span>
            {activePatient && <Badge variant="ghost" className="text-[9px]">paciente</Badge>}
          </div>
        )}
      </Card>

      {/* Empty / prompt */}
      {!hasQuery && (
        <Card className="border-none shadow-sm rounded-3xl py-16 text-center bg-slate-50 dark:bg-slate-900/40 ring-1 ring-slate-100 dark:ring-slate-800">
          <Bug size={44} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em]">
            Indica a espécie e o peso, ou escolhe um paciente
          </p>
          <p className="text-slate-400/80 text-xs mt-2">
            A cabula mostra as opções de desparasitação adequadas ao animal.
          </p>
        </Card>
      )}

      {hasQuery && isFetching && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {hasQuery && !isFetching && results.length === 0 && (
        <Card className="border-none shadow-sm rounded-3xl py-14 text-center bg-slate-50 dark:bg-slate-900/40 ring-1 ring-slate-100 dark:ring-slate-800">
          <ShieldAlert size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em]">
            Sem opções para estes critérios
          </p>
        </Card>
      )}

      {/* Results */}
      {hasQuery && !isFetching && results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map(({ ref, stock }) => (
            <Card
              key={ref.key}
              className={cn(
                "border-none shadow-sm rounded-3xl p-5 bg-white dark:bg-slate-900/60 ring-1 transition-all hover:shadow-md",
                ref.weightMatch
                  ? "ring-slate-200/60 dark:ring-slate-800"
                  : "ring-amber-200 dark:ring-amber-900/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                      TARGET_CLASS[ref.target]
                    )}
                  >
                    {ref.target === "INTERNAL" ? <Bug size={20} /> : <Syringe size={20} />}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {ref.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {ref.activeIngredient}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "border-none font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0",
                    TARGET_CLASS[ref.target]
                  )}
                >
                  {TARGET_LABEL[ref.target]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Via
                  </p>
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">{ref.route}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Intervalo
                  </p>
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {ref.frequencyLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-white/5 p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Como aplicar
                </p>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                  {ref.doseText}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Faixa de peso: {ref.weightMinKg}–{ref.weightMaxKg} kg
                  {ref.minAgeWeeks ? ` · idade mín. ${ref.minAgeWeeks} semanas` : ""}
                </p>
              </div>

              {!ref.weightMatch && (
                <div className="mt-3 flex items-start gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Fora da faixa de peso indicada — ajustar apresentação.
                </div>
              )}
              {ref.ageWarning && (
                <div className="mt-3 flex items-start gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Animal abaixo da idade mínima recomendada.
                </div>
              )}
              {ref.warnings && (
                <p className="mt-3 text-[11px] text-slate-400 font-medium leading-snug">
                  ⚠ {ref.warnings}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                {stock ? (
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg gap-1",
                        stock.inStock
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      )}
                    >
                      {stock.inStock ? (
                        <>
                          <PackageCheck size={11} /> Stock {stock.stockQuantity}
                        </>
                      ) : (
                        <>
                          <PackageX size={11} /> Sem stock
                        </>
                      )}
                    </Badge>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Preço
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {stock.price != null ? eur(stock.price) : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Pill size={13} /> Não consta no inventário
                  </p>
                )}

                {stock?.pricePerMonth != null && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Por mês
                    </p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {eur(stock.pricePerMonth)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.disclaimer && hasQuery && (
        <p className="text-[10px] text-slate-400 font-medium text-center px-4">{data.disclaimer}</p>
      )}
    </div>
  );
}
