"use client";

import React, { useState, useMemo } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ShieldCheck, Bug, Search, Check, Plus, AlertTriangle, 
  Sparkles, Weight, ArrowRight, Pill, Droplets, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DewormerProduct {
  id: string;
  name: string;
  brand: string;
  category: "EXTERNAL" | "INTERNAL" | "COMBINED";
  species: "DOG" | "CAT" | "BOTH";
  activeIngredients: string;
  form: "Comprimido" | "Spot-on (Pipeta)" | "Coleira" | "Pasta oral";
  duration: string;
  targetParasites: string;
  brackets: {
    minWeight: number;
    maxWeight: number;
    presentation: string;
    dosageInstruction: string;
  }[];
  contraindications?: string;
  instructions: string;
}

export const DEWORMER_PRODUCTS: DewormerProduct[] = [
  // ================= EXTERNAL =================
  {
    id: "bravecto-dog",
    name: "Bravecto Cão (Comprimido)",
    brand: "MSD Animal Health",
    category: "EXTERNAL",
    species: "DOG",
    activeIngredients: "Fluralaner",
    form: "Comprimido",
    duration: "12 Semanas (quase 3 meses)",
    targetParasites: "Pulgas (Ctenocephalides spp.), Carraças (Ixodes, Rhipicephalus, Dermacentor), Sarna demodécica e sarcóptica",
    brackets: [
      { minWeight: 2, maxWeight: 4.5, presentation: "Bravecto 112.5 mg (Muito Pequeno)", dosageInstruction: "1 comprimido mastigável de 12 em 12 semanas à refeição" },
      { minWeight: 4.5, maxWeight: 10, presentation: "Bravecto 250 mg (Pequeno)", dosageInstruction: "1 comprimido mastigável de 12 em 12 semanas à refeição" },
      { minWeight: 10, maxWeight: 20, presentation: "Bravecto 500 mg (Médio)", dosageInstruction: "1 comprimido mastigável de 12 em 12 semanas à refeição" },
      { minWeight: 20, maxWeight: 40, presentation: "Bravecto 1000 mg (Grande)", dosageInstruction: "1 comprimido mastigável de 12 em 12 semanas à refeição" },
      { minWeight: 40, maxWeight: 56, presentation: "Bravecto 1400 mg (Muito Grande)", dosageInstruction: "1 comprimido mastigável de 12 em 12 semanas à refeição" }
    ],
    instructions: "Administrar durante ou perto da hora da refeição para máxima biodisponibilidade."
  },
  {
    id: "bravecto-spoton-cat",
    name: "Bravecto Gato (Spot-on)",
    brand: "MSD Animal Health",
    category: "EXTERNAL",
    species: "CAT",
    activeIngredients: "Fluralaner",
    form: "Spot-on (Pipeta)",
    duration: "12 Semanas",
    targetParasites: "Pulgas e Carraças (Ixodes ricinus)",
    brackets: [
      { minWeight: 1.2, maxWeight: 2.8, presentation: "Bravecto Gato Spot-on 112.5 mg (Pequeno)", dosageInstruction: "1 pipeta transdérmica na base do crânio a cada 12 semanas" },
      { minWeight: 2.8, maxWeight: 6.25, presentation: "Bravecto Gato Spot-on 250 mg (Médio)", dosageInstruction: "1 pipeta transdérmica na base do crânio a cada 12 semanas" },
      { minWeight: 6.25, maxWeight: 12.5, presentation: "Bravecto Gato Spot-on 500 mg (Grande)", dosageInstruction: "1 pipeta transdérmica na base do crânio a cada 12 semanas" }
    ],
    instructions: "Aplicar diretamente na pele na base da cabeça do gato para evitar que lamba."
  },
  {
    id: "credelio-dog",
    name: "Credelio Cão",
    brand: "Elanco",
    category: "EXTERNAL",
    species: "DOG",
    activeIngredients: "Lotilaner",
    form: "Comprimido",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas e Carraças",
    brackets: [
      { minWeight: 1.3, maxWeight: 2.5, presentation: "Credelio 56.25 mg", dosageInstruction: "1 comprimido mensal com alimento" },
      { minWeight: 2.5, maxWeight: 5.5, presentation: "Credelio 112.5 mg", dosageInstruction: "1 comprimido mensal com alimento" },
      { minWeight: 5.5, maxWeight: 11, presentation: "Credelio 225 mg", dosageInstruction: "1 comprimido mensal com alimento" },
      { minWeight: 11, maxWeight: 22, presentation: "Credelio 450 mg", dosageInstruction: "1 comprimido mensal com alimento" },
      { minWeight: 22, maxWeight: 45, presentation: "Credelio 900 mg", dosageInstruction: "1 comprimido mensal com alimento" }
    ],
    instructions: "Mastigável palatável. Administrar com comida ou no espaço de 30 minutos após refeição."
  },
  {
    id: "credelio-cat",
    name: "Credelio Gato",
    brand: "Elanco",
    category: "EXTERNAL",
    species: "CAT",
    activeIngredients: "Lotilaner",
    form: "Comprimido",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas e Carraças (Ixodes ricinus)",
    brackets: [
      { minWeight: 0.5, maxWeight: 2.0, presentation: "Credelio Gato 12 mg", dosageInstruction: "1 comprimido mastigável mensal com alimento" },
      { minWeight: 2.0, maxWeight: 8.0, presentation: "Credelio Gato 48 mg", dosageInstruction: "1 comprimido mastigável mensal com alimento" }
    ],
    instructions: "Comprimido mastigável com aroma a baunilha/levedura. Dar com ração."
  },
  {
    id: "advantix-dog",
    name: "Advantix Cão (Spot-on)",
    brand: "Elanco",
    category: "EXTERNAL",
    species: "DOG",
    activeIngredients: "Imidaclopride + Permetrina",
    form: "Spot-on (Pipeta)",
    duration: "3 a 4 Semanas (Repelência flebótomos ~2-3 semanas)",
    targetParasites: "Flebótomos (repelente Leishmaniose), Mosquitos, Moscas do estábulo, Pulgas e Carraças",
    contraindications: "ALTAMENTE TÓXICO / FATAL PARA GATOS! Nunca aplicar nem permitir contacto próximo imediato com gatos.",
    brackets: [
      { minWeight: 1.5, maxWeight: 4.0, presentation: "Advantix Cão até 4 kg (0.4 ml)", dosageInstruction: "1 pipeta mensal na pele entre as omoplatas" },
      { minWeight: 4.0, maxWeight: 10.0, presentation: "Advantix Cão 4-10 kg (1.0 ml)", dosageInstruction: "1 pipeta mensal na pele entre as omoplatas" },
      { minWeight: 10.0, maxWeight: 25.0, presentation: "Advantix Cão 10-25 kg (2.5 ml)", dosageInstruction: "1 pipeta repartida em 3-4 pontos no dorso" },
      { minWeight: 25.0, maxWeight: 40.0, presentation: "Advantix Cão 25-40 kg (4.0 ml)", dosageInstruction: "1 pipeta repartida em 4 pontos ao longo da coluna" }
    ],
    instructions: "Evitar banhos nos 2 dias antes e 2 dias após a aplicação."
  },
  {
    id: "seresto-dog",
    name: "Seresto Coleira Cão",
    brand: "Elanco",
    category: "EXTERNAL",
    species: "DOG",
    activeIngredients: "Imidaclopride + Flumetrina",
    form: "Coleira",
    duration: "7 a 8 Meses",
    targetParasites: "Pulgas, Carraças e Piolhos mordedores. Reduz risco de Leishmaniose transmitida por flebótomos.",
    brackets: [
      { minWeight: 0.1, maxWeight: 8.0, presentation: "Seresto Cão Pequeno (< 8 kg, 38 cm)", dosageInstruction: "Colocar coleira justa (folga de 2 dedos), cortar excesso" },
      { minWeight: 8.0, maxWeight: 80.0, presentation: "Seresto Cão Grande (> 8 kg, 70 cm)", dosageInstruction: "Colocar coleira justa (folga de 2 dedos), cortar excesso" }
    ],
    instructions: "Libertação contínua de baixas doses. Resistente à água."
  },
  {
    id: "seresto-cat",
    name: "Seresto Coleira Gato",
    brand: "Elanco",
    category: "EXTERNAL",
    species: "CAT",
    activeIngredients: "Imidaclopride + Flumetrina",
    form: "Coleira",
    duration: "7 a 8 Meses",
    targetParasites: "Pulgas e Carraças",
    brackets: [
      { minWeight: 0.1, maxWeight: 10.0, presentation: "Seresto Gato (38 cm com fecho de segurança)", dosageInstruction: "Colocar ajustada no pescoço do gato com folga de 2 dedos" }
    ],
    instructions: "Inclui mecanismo de fecho de segurança duplo contra estrangulamento."
  },

  // ================= INTERNAL =================
  {
    id: "milbemax-dog",
    name: "Milbemax / Milpro Cão",
    brand: "Elanco / Virbac",
    category: "INTERNAL",
    species: "DOG",
    activeIngredients: "Milbemicina Oxima + Praziquantel",
    form: "Comprimido",
    duration: "Terapêutica pontual / Profilático a cada 3 meses",
    targetParasites: "Nemátodos (Toxocara, Toxascaris, Ancylostoma), Céstodos (Dipylidium, Taenia, Echinococcus) e prevenção Dirofilariose",
    brackets: [
      { minWeight: 0.5, maxWeight: 1.0, presentation: "Milbemax Cão Pequeno/Cachorro (1/2 comp)", dosageInstruction: "1/2 comprimido para cães pequenos/cachorros" },
      { minWeight: 1.0, maxWeight: 5.0, presentation: "Milbemax Cão Pequeno/Cachorro (1 comp)", dosageInstruction: "1 comprimido para cães pequenos/cachorros" },
      { minWeight: 5.0, maxWeight: 10.0, presentation: "Milbemax Cão Pequeno/Cachorro (2 comp)", dosageInstruction: "2 comprimidos para cães pequenos/cachorros" },
      { minWeight: 10.0, maxWeight: 25.0, presentation: "Milbemax Cão Grande (1 comp)", dosageInstruction: "1 comprimido para cães grandes (12.5mg/125mg)" },
      { minWeight: 25.0, maxWeight: 50.0, presentation: "Milbemax Cão Grande (2 comp)", dosageInstruction: "2 comprimidos para cães grandes" },
      { minWeight: 50.0, maxWeight: 75.0, presentation: "Milbemax Cão Grande (3 comp)", dosageInstruction: "3 comprimidos para cães grandes" }
    ],
    instructions: "Administrar com ou após alguma comida. Desparasitação preventiva recomendada a cada 3 meses."
  },
  {
    id: "milbemax-cat",
    name: "Milbemax / Milpro Gato",
    brand: "Elanco / Virbac",
    category: "INTERNAL",
    species: "CAT",
    activeIngredients: "Milbemicina Oxima + Praziquantel",
    form: "Comprimido",
    duration: "Profilático a cada 3 meses",
    targetParasites: "Nemátodos (Toxocara cati, Ancylostoma) e Céstodos (Dipylidium, Taenia)",
    brackets: [
      { minWeight: 0.5, maxWeight: 1.0, presentation: "Milbemax Gatinho / Gato Pequeno (1/2 comp)", dosageInstruction: "1/2 comprimido gatinhos (4mg/10mg)" },
      { minWeight: 1.0, maxWeight: 2.0, presentation: "Milbemax Gatinho / Gato Pequeno (1 comp)", dosageInstruction: "1 comprimido gatinhos (4mg/10mg)" },
      { minWeight: 2.0, maxWeight: 4.0, presentation: "Milbemax Gato Adulto (1/2 comp)", dosageInstruction: "1/2 comprimido gato adulto (16mg/40mg)" },
      { minWeight: 4.0, maxWeight: 8.0, presentation: "Milbemax Gato Adulto (1 comp)", dosageInstruction: "1 comprimido gato adulto (16mg/40mg)" },
      { minWeight: 8.0, maxWeight: 12.0, presentation: "Milbemax Gato Adulto (1 e 1/2 comp)", dosageInstruction: "1 + 1/2 comprimidos gato adulto" }
    ],
    instructions: "Comprimidos pequenos, ovalados e aromatizados a carne. Administrar com comida."
  },
  {
    id: "drontal-dog",
    name: "Drontal Plus Cão Flavour",
    brand: "Vetoquinol",
    category: "INTERNAL",
    species: "DOG",
    activeIngredients: "Febantel + Pirantel + Praziquantel",
    form: "Comprimido",
    duration: "Profilático a cada 3 meses / Tratamento Giardia (3 dias seguidos)",
    targetParasites: "Nematódeos, Cestódeos e Giardia duodenalis",
    brackets: [
      { minWeight: 2.0, maxWeight: 5.0, presentation: "Drontal Plus Cão (1/2 comp 10kg)", dosageInstruction: "1/2 comprimido formato osso" },
      { minWeight: 5.0, maxWeight: 10.0, presentation: "Drontal Plus Cão (1 comp 10kg)", dosageInstruction: "1 comprimido formato osso por cada 10 kg" },
      { minWeight: 10.0, maxWeight: 20.0, presentation: "Drontal Plus Cão (2 comp 10kg)", dosageInstruction: "2 comprimidos formato osso" },
      { minWeight: 20.0, maxWeight: 35.0, presentation: "Drontal Plus XL Cão (1 comp 35kg)", dosageInstruction: "1 comprimido XL (para 35 kg)" },
      { minWeight: 35.0, maxWeight: 52.5, presentation: "Drontal Plus XL (1.5 comp 35kg)", dosageInstruction: "1 comprimido e meio XL" }
    ],
    instructions: "Dose de 1 comprimido por cada 10 kg de peso vivo. Sabor a carne."
  },
  {
    id: "profender-cat",
    name: "Profender Gato (Spot-on)",
    brand: "Vetoquinol",
    category: "INTERNAL",
    species: "CAT",
    activeIngredients: "Emodepsida + Praziquantel",
    form: "Spot-on (Pipeta)",
    duration: "Profilático a cada 3 meses",
    targetParasites: "Nemátodos redondos (Toxocara, Ancylostoma) e Céstodos / Ténias (Dipylidium, Taenia)",
    brackets: [
      { minWeight: 0.5, maxWeight: 2.5, presentation: "Profender Gato Pequeno (0.35 ml)", dosageInstruction: "1 pipeta tópica na nuca" },
      { minWeight: 2.5, maxWeight: 5.0, presentation: "Profender Gato Médio (0.70 ml)", dosageInstruction: "1 pipeta tópica na nuca" },
      { minWeight: 5.0, maxWeight: 8.0, presentation: "Profender Gato Grande (1.12 ml)", dosageInstruction: "1 pipeta tópica na nuca" }
    ],
    instructions: "Excelente alternativa para gatos em que a administração oral de comprimidos é difícil."
  },
  {
    id: "panacur-oral",
    name: "Panacur (Fenbendazol)",
    brand: "MSD Animal Health",
    category: "INTERNAL",
    species: "BOTH",
    activeIngredients: "Fenbendazol (500 mg)",
    form: "Comprimido",
    duration: "3 a 5 dias consecutivos de tratamento",
    targetParasites: "Nemátodos gastrintestinais, Giardia e parasitas pulmonares (Aelurostrongylus / Angiostrongylus)",
    brackets: [
      { minWeight: 1.0, maxWeight: 5.0, presentation: "Panacur 250 mg ou pasta oral", dosageInstruction: "50 mg/kg SID por 3 a 5 dias consecutivos" },
      { minWeight: 5.0, maxWeight: 10.0, presentation: "Panacur 500 mg (1 comp / dia)", dosageInstruction: "1 comprimido de 500 mg SID durante 3 dias (5 dias em Giardia)" },
      { minWeight: 10.0, maxWeight: 20.0, presentation: "Panacur 500 mg (2 comp / dia)", dosageInstruction: "2 comprimidos de 500 mg SID durante 3 dias" },
      { minWeight: 20.0, maxWeight: 40.0, presentation: "Panacur 500 mg (4 comp / dia)", dosageInstruction: "4 comprimidos de 500 mg SID durante 3 dias" }
    ],
    instructions: "Protocolo de eleição para Giardia: 50 mg/kg uma vez ao dia durante 5 dias consecutivos."
  },

  // ================= COMBINED (INTERNAL + EXTERNAL) =================
  {
    id: "nexgard-spectra-dog",
    name: "NexGard Spectra Cão",
    brand: "Boehringer Ingelheim",
    category: "COMBINED",
    species: "DOG",
    activeIngredients: "Afoxolaner + Milbemicina Oxima",
    form: "Comprimido",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas, Carraças, Sarnas (otodécica, sarcóptica, demodécica), Vermes redondos gastrintestinais e prevenção de Dirofilariose / Angiostrongilose",
    brackets: [
      { minWeight: 2.0, maxWeight: 3.5, presentation: "NexGard Spectra 2-3.5 kg (9mg/2mg)", dosageInstruction: "1 comprimido mastigável mensal" },
      { minWeight: 3.5, maxWeight: 7.5, presentation: "NexGard Spectra 3.5-7.5 kg (19mg/4mg)", dosageInstruction: "1 comprimido mastigável mensal" },
      { minWeight: 7.5, maxWeight: 15.0, presentation: "NexGard Spectra 7.5-15 kg (38mg/8mg)", dosageInstruction: "1 comprimido mastigável mensal" },
      { minWeight: 15.0, maxWeight: 30.0, presentation: "NexGard Spectra 15-30 kg (75mg/15mg)", dosageInstruction: "1 comprimido mastigável mensal" },
      { minWeight: 30.0, maxWeight: 60.0, presentation: "NexGard Spectra 30-60 kg (150mg/30mg)", dosageInstruction: "1 comprimido mastigável mensal" }
    ],
    instructions: "Comprimido mastigável com sabor a carne. Amplo espectro endo e ectoparasitário."
  },
  {
    id: "bravecto-plus-cat",
    name: "Bravecto Plus Gato (Spot-on)",
    brand: "MSD Animal Health",
    category: "COMBINED",
    species: "CAT",
    activeIngredients: "Fluralaner + Moxidectina",
    form: "Spot-on (Pipeta)",
    duration: "12 Semanas (3 Meses)",
    targetParasites: "Pulgas, Carraças, Ácaros auriculares, Nemátodos gastrointestinais (Toxocara, Ancylostoma) e prevenção de Dirofilariose",
    brackets: [
      { minWeight: 1.2, maxWeight: 2.8, presentation: "Bravecto Plus Gato 1.2-2.8 kg (112.5mg/5.6mg)", dosageInstruction: "1 pipeta tópica na nuca a cada 12 semanas" },
      { minWeight: 2.8, maxWeight: 6.25, presentation: "Bravecto Plus Gato 2.8-6.25 kg (250mg/12.5mg)", dosageInstruction: "1 pipeta tópica na nuca a cada 12 semanas" },
      { minWeight: 6.25, maxWeight: 12.5, presentation: "Bravecto Plus Gato 6.25-12.5 kg (500mg/25mg)", dosageInstruction: "1 pipeta tópica na nuca a cada 12 semanas" }
    ],
    instructions: "Proteção combinada interna e externa com duração ultra longa de 12 semanas."
  },
  {
    id: "stronghold-plus-cat",
    name: "Stronghold Plus Gato",
    brand: "Zoetis",
    category: "COMBINED",
    species: "CAT",
    activeIngredients: "Selamectina + Sarolaner",
    form: "Spot-on (Pipeta)",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas, Carraças, Ácaros auriculares (Otodectes), Piolhos mordedores, Lombrigas e Ancilóstomos, Prevenção Dirofilariose",
    brackets: [
      { minWeight: 1.25, maxWeight: 2.5, presentation: "Stronghold Plus Gato 1.25-2.5 kg (15mg/2.5mg)", dosageInstruction: "1 pipeta mensal na base do pescoço" },
      { minWeight: 2.5, maxWeight: 5.0, presentation: "Stronghold Plus Gato 2.5-5.0 kg (30mg/5mg)", dosageInstruction: "1 pipeta mensal na base do pescoço" },
      { minWeight: 5.0, maxWeight: 10.0, presentation: "Stronghold Plus Gato 5.0-10.0 kg (60mg/10mg)", dosageInstruction: "1 pipeta mensal na base do pescoço" }
    ],
    instructions: "Excelente eficácia acaricida (otodécica) e carracicida rápida para felinos."
  },
  {
    id: "advocate-dog",
    name: "Advocate Cão (Spot-on)",
    brand: "Elanco",
    category: "COMBINED",
    species: "DOG",
    activeIngredients: "Imidaclopride + Moxidectina",
    form: "Spot-on (Pipeta)",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas, Piolhos, Sarna sarcóptica, sarna demodécica, sarna otodécica, microfilárias, vermes pulmonares e gastrointestinais",
    brackets: [
      { minWeight: 1.0, maxWeight: 4.0, presentation: "Advocate Cão Pequeno (< 4 kg, 0.4 ml)", dosageInstruction: "1 pipeta mensal tópica no dorso" },
      { minWeight: 4.0, maxWeight: 10.0, presentation: "Advocate Cão Médio (4-10 kg, 1.0 ml)", dosageInstruction: "1 pipeta mensal tópica no dorso" },
      { minWeight: 10.0, maxWeight: 25.0, presentation: "Advocate Cão Grande (10-25 kg, 2.5 ml)", dosageInstruction: "1 pipeta mensal dividida ao longo do dorso" },
      { minWeight: 25.0, maxWeight: 40.0, presentation: "Advocate Cão Extra Grande (25-40 kg, 4.0 ml)", dosageInstruction: "1 pipeta mensal dividida ao longo do dorso" }
    ],
    instructions: "Referência no tratamento de sarnas (Sarcoptes, Demodex) e parasitas pulmonares (Angiostrongylus vasorum)."
  },
  {
    id: "advocate-cat",
    name: "Advocate Gato (Spot-on)",
    brand: "Elanco",
    category: "COMBINED",
    species: "CAT",
    activeIngredients: "Imidaclopride + Moxidectina",
    form: "Spot-on (Pipeta)",
    duration: "1 Mês (30 dias)",
    targetParasites: "Pulgas, Ácaros auriculares, Nemátodos gastrointestinais, Prevenção de Dirofilariose",
    brackets: [
      { minWeight: 1.0, maxWeight: 4.0, presentation: "Advocate Gato Pequeno (< 4 kg, 0.4 ml)", dosageInstruction: "1 pipeta tópica na base do crânio mensal" },
      { minWeight: 4.0, maxWeight: 8.0, presentation: "Advocate Gato Grande (4-8 kg, 0.8 ml)", dosageInstruction: "1 pipeta tópica na base do crânio mensal" }
    ],
    instructions: "Aplicar afastando o pêlo na base da nuca para evitar lambedura."
  }
];

interface DewormingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientWeight?: number | string;
  patientSpecies?: string;
  patientName?: string;
  onInsertTreatment: (textToInsert: string) => void;
}

export function DewormingSimulatorModal({
  isOpen,
  onClose,
  patientWeight,
  patientSpecies,
  patientName,
  onInsertTreatment,
}: DewormingSimulatorModalProps) {
  // Normalize initial weight
  const initialWeightNum = useMemo(() => {
    if (!patientWeight) return 5.0;
    const parsed = typeof patientWeight === "number" ? patientWeight : parseFloat(String(patientWeight).replace(",", "."));
    return isNaN(parsed) || parsed <= 0 ? 5.0 : parsed;
  }, [patientWeight]);

  const [currentWeight, setCurrentWeight] = useState<number>(initialWeightNum);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "EXTERNAL" | "INTERNAL" | "COMBINED">("ALL");

  // Determine species filter
  const isFeline = useMemo(() => {
    if (!patientSpecies) return false;
    const s = patientSpecies.toLowerCase();
    return s.includes("gato") || s.includes("fel") || s.includes("cat");
  }, [patientSpecies]);

  const [speciesFilter, setSpeciesFilter] = useState<"AUTO" | "DOG" | "CAT">(
    isFeline ? "CAT" : "DOG"
  );

  // Sync when initial weight changes
  React.useEffect(() => {
    if (initialWeightNum > 0) {
      setCurrentWeight(initialWeightNum);
    }
  }, [initialWeightNum]);

  // Sync species
  React.useEffect(() => {
    setSpeciesFilter(isFeline ? "CAT" : "DOG");
  }, [isFeline]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return DEWORMER_PRODUCTS.filter(prod => {
      // Species match
      if (speciesFilter === "DOG" && prod.species === "CAT") return false;
      if (speciesFilter === "CAT" && prod.species === "DOG") return false;

      // Category match
      if (selectedCategory !== "ALL" && prod.category !== selectedCategory) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesActive = prod.activeIngredients.toLowerCase().includes(q);
        const matchesParasites = prod.targetParasites.toLowerCase().includes(q);
        if (!matchesName && !matchesActive && !matchesParasites) return false;
      }

      return true;
    });
  }, [speciesFilter, selectedCategory, searchQuery]);

  // Separate into the 3 main user-requested groups
  const externalProducts = useMemo(() => filteredProducts.filter(p => p.category === "EXTERNAL"), [filteredProducts]);
  const internalProducts = useMemo(() => filteredProducts.filter(p => p.category === "INTERNAL"), [filteredProducts]);
  const combinedProducts = useMemo(() => filteredProducts.filter(p => p.category === "COMBINED"), [filteredProducts]);

  // Helper to find suited bracket for a product
  const getBracketForWeight = (prod: DewormerProduct, weight: number) => {
    const found = prod.brackets.find(b => weight >= b.minWeight && weight <= b.maxWeight);
    if (found) return found;
    // If over max, return the largest bracket
    if (weight > prod.brackets[prod.brackets.length - 1].maxWeight) {
      return prod.brackets[prod.brackets.length - 1];
    }
    // If under min, return the smallest bracket
    return prod.brackets[0];
  };

  const handleSelectProduct = (prod: DewormerProduct) => {
    const bracket = getBracketForWeight(prod, currentWeight);
    const categoryLabel = 
      prod.category === "EXTERNAL" ? "Desparasitante Externo" :
      prod.category === "INTERNAL" ? "Desparasitante Interno" :
      "Desparasitante Interno e Externo (Combinado)";

    const formatted = `\n• ${categoryLabel}: ${prod.name} (${prod.activeIngredients})\n  - Apresentação recomendada para ${currentWeight} kg: ${bracket.presentation}\n  - Posologia: ${bracket.dosageInstruction}\n  - Frequência / Duração: ${prod.duration}\n  - Instruções: ${prod.instructions}`;

    onInsertTreatment(formatted);
    toast.success(`${prod.name} adicionado ao Tratamento!`);
    onClose();
  };

  const renderProductCard = (prod: DewormerProduct) => {
    const bracket = getBracketForWeight(prod, currentWeight);
    const isWeightWithin = currentWeight >= bracket.minWeight && currentWeight <= bracket.maxWeight;

    return (
      <div 
        key={prod.id}
        className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-teal-500/50 hover:shadow-md transition-all group"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {prod.name}
                </h4>
                <Badge variant="outline" className="text-[10px] font-semibold py-0 px-1.5 border-slate-300 dark:border-white/10">
                  {prod.brand}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Princípio Ativo:</span> {prod.activeIngredients}
              </p>
            </div>
            <Badge className={cn("text-[10px] font-bold shrink-0",
              prod.form === "Comprimido" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300" :
              prod.form === "Coleira" ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300" :
              "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300"
            )}>
              {prod.form}
            </Badge>
          </div>

          {/* Dosage for patient weight highlight */}
          <div className={cn("p-3 rounded-xl border text-xs space-y-1 transition-colors",
            isWeightWithin 
              ? "bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50 text-teal-950 dark:text-teal-100" 
              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200"
          )}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
                <Weight className="w-3.5 h-3.5" /> Dose para {currentWeight} kg:
              </span>
              <span className="text-[11px] font-semibold bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-2xs">
                {bracket.minWeight} - {bracket.maxWeight} kg
              </span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white pt-0.5">
              {bracket.presentation}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {bracket.dosageInstruction}
            </div>
          </div>

          {/* Target and Duration */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Duração:</span> {prod.duration}
            </div>
            <div className="line-clamp-2 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Espectro:</span> {prod.targetParasites}
            </div>
            {prod.contraindications && (
              <div className="flex items-start gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{prod.contraindications}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {prod.instructions}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSelectProduct(prod)}
            className="h-8 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Inserir no Tratamento
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-slate-200 dark:border-white/10">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Simulador de Desparasitação
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Cálculo automático de apresentações e dosagens anti-parasitárias pelo peso do paciente
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Species Toggle */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSpeciesFilter("DOG")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  speciesFilter === "DOG" 
                    ? "bg-teal-600 text-white shadow-xs" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                🐶 Cão
              </button>
              <button
                type="button"
                onClick={() => setSpeciesFilter("CAT")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  speciesFilter === "CAT" 
                    ? "bg-teal-600 text-white shadow-xs" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                🐱 Gato
              </button>
            </div>
          </div>

          {/* Weight Bar & Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
            {/* Weight Input */}
            <div className="md:col-span-5 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Weight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                    Peso do Animal
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {patientName ? `Paciente: ${patientName}` : "Ajustável para simulação"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="120"
                  value={currentWeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) setCurrentWeight(val);
                  }}
                  className="w-20 h-9 font-black text-center text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 rounded-xl border-teal-300 shadow-2xs"
                />
                <span className="text-xs font-black text-teal-700 dark:text-teal-300">kg</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome (ex: Bravecto, Nexgard, Milbemax) ou princípio ativo..."
                className="pl-9 h-11 bg-white dark:bg-slate-800/80 rounded-2xl border-slate-200 dark:border-white/10 text-xs font-medium"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Categories Tabs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl text-xs font-bold">
                Todos ({filteredProducts.length})
              </TabsTrigger>
              <TabsTrigger value="external" className="rounded-xl text-xs font-bold gap-1 text-blue-600 dark:text-blue-400">
                <Droplets className="w-3.5 h-3.5" /> Externos ({externalProducts.length})
              </TabsTrigger>
              <TabsTrigger value="internal" className="rounded-xl text-xs font-bold gap-1 text-amber-600 dark:text-amber-400">
                <Pill className="w-3.5 h-3.5" /> Internos ({internalProducts.length})
              </TabsTrigger>
              <TabsTrigger value="combined" className="rounded-xl text-xs font-bold gap-1 text-teal-600 dark:text-teal-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Endo + Ecto ({combinedProducts.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB ALL: Section by Section */}
            <TabsContent value="all" className="space-y-6 mt-5">
              {/* 1. Desparasitantes Externos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Desparasitantes Externos (Ectoparasitas)
                  </h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    Pulgas, Carraças, Flebótomos & Ácaros
                  </Badge>
                </div>
                {externalProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {externalProducts.map(renderProductCard)}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum desparasitante externo encontrado.</p>
                )}
              </div>

              {/* 2. Desparasitantes Internos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Desparasitantes Internos (Endoparasitas)
                  </h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    Nemátodos, Céstodos & Protozoários
                  </Badge>
                </div>
                {internalProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internalProducts.map(renderProductCard)}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum desparasitante interno encontrado.</p>
                )}
              </div>

              {/* 3. Desparasitantes Internos e Externos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Desparasitantes Internos e Externos (Combinados)
                  </h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    Largo Espectro Endo + Ecto
                  </Badge>
                </div>
                {combinedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combinedProducts.map(renderProductCard)}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Nenhum desparasitante combinado encontrado.</p>
                )}
              </div>
            </TabsContent>

            {/* TAB EXTERNAL */}
            <TabsContent value="external" className="mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {externalProducts.map(renderProductCard)}
              </div>
            </TabsContent>

            {/* TAB INTERNAL */}
            <TabsContent value="internal" className="mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {internalProducts.map(renderProductCard)}
              </div>
            </TabsContent>

            {/* TAB COMBINED */}
            <TabsContent value="combined" className="mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combinedProducts.map(renderProductCard)}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Ao clicar em <strong>Inserir no Tratamento</strong>, o protocolo com dosagem calculada é adicionado à Secção 6.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-9 px-4"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
